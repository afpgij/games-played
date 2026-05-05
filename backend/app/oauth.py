from authlib.integrations.starlette_client import OAuth

from .config import settings

oauth = OAuth()

if settings.GOOGLE_CLIENT_ID:
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

if settings.DISCORD_CLIENT_ID:
    oauth.register(
        name="discord",
        client_id=settings.DISCORD_CLIENT_ID,
        client_secret=settings.DISCORD_CLIENT_SECRET,
        access_token_url="https://discord.com/api/oauth2/token",
        authorize_url="https://discord.com/api/oauth2/authorize",
        api_base_url="https://discord.com/api/",
        client_kwargs={"scope": "identify email"},
    )
