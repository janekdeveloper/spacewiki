from database import db
from models.user import User
from models.token import Token
from utils.tokenizer import generate_token
from flask import Blueprint, request, jsonify, render_template
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    existing_user = User.query.filter(
        (User.username == username) | (User.email == email)
    ).first()

    if existing_user:
        return jsonify({'message': 'User with such username or email already exists'}), 400

    if not username or not password or not email:
        return jsonify({"error": "Missing fields"}), 400

    hashed_password = generate_password_hash(data["password"])
    new_user = User(
        username=username,
        email=email,
        password_hash=hashed_password
    )
    db.session.add(new_user)
    db.session.commit()

    access_token = generate_token(new_user.id)
    token_entry = Token(user_id=new_user.id, token=access_token)
    db.session.add(token_entry)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully', 'access_token': access_token}), 201

@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = generate_token(user.id)
    token_entry = Token(user_id=user.id, token=access_token)
    db.session.add(token_entry)
    db.session.commit()

    return jsonify({"message": "User authorized successfully", "access_token": access_token}), 200


@auth_bp.route("/register")
def register_page():
    return render_template("register.html")

@auth_bp.route("/login")
def login_page():
    return render_template("login.html")

