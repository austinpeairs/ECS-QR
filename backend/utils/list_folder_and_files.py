import os
import httpx
from dotenv import load_dotenv
from ms_graph import get_access_token, MS_GRAPH_BASE_URL

def list_root_folder(headers):
    url = f'{MS_GRAPH_BASE_URL}me/drive/root/children'
    response = httpx.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return [item for item in data['value']]
    else:
        print(f'Failed to list root folder: {response.status_code}')
        return []
    
def list_folder_children(headers, folder_id):
    url = f'{MS_GRAPH_BASE_URL}me/drive/items/{folder_id}/children'
    response = httpx.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return [item for item in data['value']]
    else:
        print(f'Failed to list children of folder {folder_id}: {response.status_code}')
        return []

def main():
    load_dotenv()
    APPLICATION_ID = os.getenv('APPLICATION_ID')
    CLIENT_SECRET = os.getenv('CLIENT_SECRET')
    SCOPES = ['User.Read', 'Files.ReadWrite.All']

    try:
        access_token = get_access_token(APPLICATION_ID, CLIENT_SECRET, SCOPES)
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        root_folder = list_root_folder(headers)
        for folder in root_folder:
            if 'folder' in folder:
                print(f'Folder id: {folder["id"]}')
                print(f'Folder name: {folder["name"]}')
                print(f'Folder web url: {folder["webUrl"]}')
            elif 'file' in folder:
                print(f'File id: {folder["id"]}')
                print(f'File name: {folder["name"]}')
                print(f'File web url: {folder["webUrl"]}')
            print('-' * 50)
    except Exception as e:
        print(f'Error: {e}')

main()