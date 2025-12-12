import requests
from typing import Generator, Optional, Union
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Detect available library
pollinations_lib = None
LIBRARY_TYPE = "direct_api"

try:
    import pollinations.ai as pollinations_lib
    LIBRARY_TYPE = "pollinations.ai"
except ImportError:
    try:
        import pollinations as pollinations_lib
        LIBRARY_TYPE = "pollinations"
    except ImportError:
        try:
            from pollinations_api import PollinationsAPI
            pollinations_lib = PollinationsAPI()
            LIBRARY_TYPE = "pollinations-api"
        except ImportError:
            LIBRARY_TYPE = "direct_api"

print(f"[Pollinations] Using library type: {LIBRARY_TYPE}")


class PollinationsClient:
    """Unified client for Pollinations AI text generation"""
    
    BASE_URL = "https://text.pollinations.ai/"
    
    # Available models on Pollinations
    MODELS = {
        "openai": "openai",
        "mistral": "mistral", 
        "llama": "llama",
        "deepseek": "deepseek",
        "claude": "claude",
        "gemini": "gemini",
    }
    
    def __init__(self, model: str = "openai", timeout: int = 120):
        self.model = model
        self.timeout = timeout
        self.executor = ThreadPoolExecutor(max_workers=3)
    
    def generate_sync(
        self, 
        prompt: str, 
        system: str = "You are a helpful AI assistant.",
        stream: bool = False
    ) -> Union[str, Generator[str, None, None]]:
        """Synchronous text generation"""
        
        if LIBRARY_TYPE == "pollinations.ai" and pollinations_lib:
            return self._generate_with_library(prompt, system, stream)
        else:
            return self._generate_with_api(prompt, system, stream)
    
    async def generate(
        self,
        prompt: str,
        system: str = "You are a helpful AI assistant.",
        stream: bool = False
    ) -> Union[str, Generator[str, None, None]]:
        """Async text generation"""
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            self.executor,
            lambda: self.generate_sync(prompt, system, stream)
        )
        return result
    
    def _generate_with_library(
        self, 
        prompt: str, 
        system: str, 
        stream: bool
    ) -> Union[str, Generator[str, None, None]]:
        """Generate using pollinations library"""
        
        text_model = pollinations_lib.Text(model=self.model, system=system)
        
        if stream:
            def generate() -> Generator[str, None, None]:
                try:
                    for chunk in text_model(prompt, stream=True):
                        yield chunk
                except Exception as e:
                    yield f"Error: {str(e)}"
            return generate()
        else:
            return text_model(prompt)
    
    def _generate_with_api(
        self, 
        prompt: str, 
        system: str, 
        stream: bool
    ) -> Union[str, Generator[str, None, None]]:
        """Generate using direct API call"""
        
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]
        
        payload = {
            "messages": messages,
            "model": self.model,
            "stream": stream
        }
        
        headers = {"Content-Type": "application/json"}
        
        try:
            if stream:
                response = requests.post(
                    self.BASE_URL,
                    json=payload,
                    headers=headers,
                    stream=True,
                    timeout=self.timeout
                )
                response.raise_for_status()
                
                def generate() -> Generator[str, None, None]:
                    for line in response.iter_lines():
                        if line:
                            yield line.decode('utf-8')
                return generate()
            else:
                response = requests.post(
                    self.BASE_URL,
                    json=payload,
                    headers=headers,
                    timeout=self.timeout
                )
                response.raise_for_status()
                return response.text
                
        except requests.exceptions.Timeout:
            return "Error: Request timed out. Please try again."
        except requests.exceptions.RequestException as e:
            return f"Error: {str(e)}"
    
    def chat(
        self,
        messages: list,
        system: str = "You are a helpful AI assistant."
    ) -> str:
        """Chat with multiple messages"""
        
        # Format messages for API
        formatted_messages = [{"role": "system", "content": system}]
        formatted_messages.extend(messages)
        
        payload = {
            "messages": formatted_messages,
            "model": self.model,
            "stream": False
        }
        
        headers = {"Content-Type": "application/json"}
        
        try:
            response = requests.post(
                self.BASE_URL,
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.text
        except Exception as e:
            return f"Error: {str(e)}"


# Create default client instance
pollinations_client = PollinationsClient(model="gemini")