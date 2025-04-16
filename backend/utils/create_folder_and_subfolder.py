import os
import httpx
from dotenv import load_dotenv
from ms_graph import get_access_token, MS_GRAPH_BASE_URL

def create_folder(headers, folder_name, parent_folder_id=None):
    url = f'{MS_GRAPH_BASE_URL}me/drive/root/children'
    if parent_folder_id:
        url = f'{MS_GRAPH_BASE_URL}me/drive/items/{parent_folder_id}/children'

    payload = {
        'name': folder_name,
        'folder': {},
        '@microsoft.graph.conflictBehavior': 'fail'
    }

    response = httpx.post(url, headers=headers, json=payload)
    
    if response.status_code == 201:
        data = response.json()
        return data
    else:
        print(f'Failed to create folder {folder_name}')
        print('Description:')
        print(response.json()['error']['message'])
        return None

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
        folder_name = 'Test Folder'
        created_folder = create_folder(headers, folder_name, '4BC0A8F9C6207CF4%21215979')
        if created_folder:
            print(f'Created folder: {created_folder["name"]}')
            print(f'Folder id: {created_folder["id"]}')
            print(f'Folder web url: {created_folder["webUrl"]}')
    except Exception as e:
        print(f'Error: {e}')

main()