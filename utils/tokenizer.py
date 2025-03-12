import jwt
from functools import wraps
from datetime import datetime
from flask import request, jsonify
from models.token import Token
from config import *

def token_required(f):
    """Decorator that checks if a valid token is present in the request headers.

    Args:
        f (function): The function to be decorated.

    Returns:
        function: The decorated function.

    Raises:
        401: If the token is missing or invalid.
        500: If there is a server error.

    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"message": "Token is missing"}), 401

        try:
            token_record = Token.query.filter_by(token=token).first()
            if not token_record:
                return jsonify({"message": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"message": "Server error"}), 500

        return f(token, *args, **kwargs)
    return decorated_function

def generate_token(user_id):
    """Generates an access token for a user.

    Args:
        user_id (int): The ID of the user.

    Returns:
        str: The access token.

    """
    payload = {
        "user_id": user_id,
        "created_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    token = jwt.encode(payload,Config.JWT_SECRET_KEY,algorithm='HS256')
    return token