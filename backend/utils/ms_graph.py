import os
import msal
from flask import session, url_for, redirect, request
from dotenv import load_dotenv

MS_GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0/'

def get_auth_url(application_id, redirect_uri, scopes):
    """Generate the Microsoft OAuth authorization URL"""
    client = msal.ConfidentialClientApplication(
        client_id=application_id,
        client_credential=None,  # No need for client secret at this step
        authority="https://login.microsoftonline.com/organizations/"
    )
    
    auth_url = client.get_authorization_request_url(
        scopes=scopes,
        redirect_uri=redirect_uri,
        response_type="code"
    )
    return auth_url

def get_token_from_code(application_id, client_secret, redirect_uri, auth_code, scopes):
    """Exchange authorization code for access token"""
    client = msal.ConfidentialClientApplication(
        client_id=application_id,
        client_credential=client_secret,
        authority="https://login.microsoftonline.com/organizations/"
    )
    
    token_response = client.acquire_token_by_authorization_code(
        code=auth_code,
        scopes=scopes,
        redirect_uri=redirect_uri
    )
    
    if 'access_token' in token_response:
        return token_response
    else:
        raise Exception('Failed to acquire access token: ' + str(token_response))