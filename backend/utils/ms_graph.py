import os
import msal
from flask import session, url_for, redirect, request
from dotenv import load_dotenv

MS_GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0/'

def get_auth_url(application_id, redirect_uri, scopes):
    TENANT_ID = os.getenv('TENANT_ID')
    """Generate the Microsoft OAuth authorization URL"""
    # print(f"DEBUG: Creating auth URL with:")
    # print(f"  - Application ID: {application_id}")
    # print(f"  - Tenant ID: {TENANT_ID}")
    # print(f"  - Redirect URI: {redirect_uri}")
    # print(f"  - Scopes: {scopes}")
    
    client = msal.ConfidentialClientApplication(
        client_id=application_id,
        authority=f"https://login.microsoftonline.com/{TENANT_ID}/"
    )
    
    auth_url = client.get_authorization_request_url(
        scopes=scopes,
        redirect_uri=redirect_uri,
        response_type="code"
    )
    
    # print(f"DEBUG: Generated auth URL: {auth_url}")
    return auth_url

def get_token_from_code(application_id, client_secret, redirect_uri, auth_code, scopes):
    TENANT_ID = os.getenv('TENANT_ID')
    """Exchange authorization code for access token"""
    # print(f"DEBUG: Exchanging code for token:")
    # print(f"  - Application ID: {application_id}")
    # print(f"  - Tenant ID: {TENANT_ID}")
    # print(f"  - Redirect URI: {redirect_uri}")
    # print(f"  - Auth Code: {auth_code[:10]}..." if auth_code else "None")
    # print(f"  - Scopes: {scopes}")
    
    client = msal.ConfidentialClientApplication(
        client_id=application_id,
        client_credential=client_secret,
        authority=f"https://login.microsoftonline.com/{TENANT_ID}/"
    )
    
    token_response = client.acquire_token_by_authorization_code(
        code=auth_code,
        scopes=scopes,
        redirect_uri=redirect_uri
    )
    
    # print(f"DEBUG: Token response keys: {list(token_response.keys())}")
    
    # Print detailed error information if token acquisition failed
    # if 'error' in token_response:
        # print(f"ERROR: Token acquisition failed:")
        # print(f"  - Error: {token_response.get('error')}")
        # print(f"  - Error Description: {token_response.get('error_description')}")
        # print(f"  - Error Codes: {token_response.get('error_codes')}")
        # print(f"  - Correlation ID: {token_response.get('correlation_id')}")
        # print(f"  - Full response: {token_response}")
    
    if 'access_token' in token_response:
        # print(f"DEBUG: Successfully acquired token")
        # if 'id_token_claims' in token_response:
            # claims = token_response['id_token_claims']
            # print(f"DEBUG: User info:")
            # print(f"  - Name: {claims.get('name')}")
            # print(f"  - Email: {claims.get('email') or claims.get('preferred_username')}")
            # print(f"  - Tenant ID: {claims.get('tid')}")
            # print(f"  - Object ID: {claims.get('oid')}")
        return token_response
    else:
        raise Exception('Failed to acquire access token: ' + str(token_response))