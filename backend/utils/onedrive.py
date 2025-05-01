import os
import httpx
import re
from dotenv import load_dotenv
from utils.ms_graph import MS_GRAPH_BASE_URL

class OneDriveManager:
    def __init__(self, access_token=None):
        load_dotenv()
        self.app_id = os.getenv('APPLICATION_ID')
        self.client_secret = os.getenv('CLIENT_SECRET')
        self.scopes = ['User.Read', 'Files.ReadWrite.All']
        self.headers = None
        if access_token:
            self.headers = {
                'Authorization': f'Bearer {access_token}'
            }
    
    def list_folders(self):
        """List folders in root"""
        url = f'{MS_GRAPH_BASE_URL}me/drive/root/children'
        response = httpx.get(url, headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            folders = [item for item in data['value'] if 'folder' in item]
            return folders
        else:
            print(f'Failed to list folders: {response.status_code}')
            return []
    
    def upload_file(self, file_path, folder_id=None):
        """
        Upload a file to OneDrive
        If folder_id is provided, upload to that folder; otherwise, upload to root
        """
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        # Determine upload endpoint (root or specific folder)
        if folder_id:
            upload_url = f"{MS_GRAPH_BASE_URL}me/drive/items/{folder_id}:/{file_name}:/content"
        else:
            upload_url = f"{MS_GRAPH_BASE_URL}me/drive/root:/{file_name}:/content"
        
        # For files under 4MB, we can do a simple upload
        if file_size < 4 * 1024 * 1024:
            with open(file_path, 'rb') as file_data:
                response = httpx.put(
                    upload_url,
                    headers=self.headers,
                    content=file_data.read()
                )
            
            if response.status_code in [200, 201]:
                return response.json()
            else:
                print(f"Upload failed with status code: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        else:
            # For larger files, implement upload session (not implemented in this basic version)
            print("Large file upload not implemented yet")
            return None
    
    def get_shared_link(self, item_id):
        """Generate a shareable link for the uploaded file"""
        url = f'{MS_GRAPH_BASE_URL}me/drive/items/{item_id}/createLink'
        
        data = {
            "type": "view",
            "scope": "anonymous"
        }
        
        try:
            response = httpx.post(url, headers=self.headers, json=data)
            
            # Accept both 200 OK and 201 Created as success
            if response.status_code in [200, 201]:
                response_data = response.json()
                link_url = response_data.get('link', {}).get('webUrl')
                if link_url:
                    return link_url
                else:
                    print(f"Error: Missing 'webUrl' in response: {response_data}")
                    return None
            else:
                print(f"Error: Failed to create sharing link: HTTP {response.status_code}")
                print(f"Response: {response.text}")
                
                # Check if token expired
                if response.status_code == 401:
                    print("Token may have expired. Attempting to re-authenticate...")
                    if self._authenticate():
                        # Retry the request with new token
                        response = httpx.post(url, headers=self.headers, json=data)
                        if response.status_code in [200, 201]:
                            return response.json().get('link', {}).get('webUrl')
                
                return None
        except Exception as e:
            print(f"Exception in get_shared_link: {e}")
            return None
        
    def create_folder(self, folder_name):
        """Create a new folder in OneDrive root and return its ID"""
        url = f'{MS_GRAPH_BASE_URL}me/drive/root/children'
        
        data = {
            "name": folder_name,
            "folder": {},  # This indicates it's a folder
            "@microsoft.graph.conflictBehavior": "rename"
        }
        
        response = httpx.post(url, headers=self.headers, json=data)
        
        if response.status_code == 201:  # Created
            return response.json()['id']
        else:
            print(f'Failed to create folder: {response.status_code} - {response.text}')
            return None
        
    def get_embed_link(self, item_id: str) -> str:
        """Create an anonymous embed link and return the raw <img> src URL."""
        url = f"{MS_GRAPH_BASE_URL}me/drive/items/{item_id}/createLink"
        body = {"type": "embed", "scope": "anonymous"}
        resp = httpx.post(url, headers=self.headers, json=body)
        resp.raise_for_status()
        data = resp.json()
        # Graph returns a fragment of HTML like: <iframe src="https://.../embed?..."></iframe>
        html = data.get("webHtml", "")
        m = re.search(r'src="([^"]+)"', html)
        if not m:
            raise Exception("No embed src found in response")
        return m.group(1)