from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class AdminLogin(BaseModel):
    email: str
    password: str

class CodeResponse(BaseModel):
    code: str
    expires_in_seconds: int

class VerifyCode(BaseModel):
    code: str
    # Device information passed during verification
    hostname: str
    local_ip: str
