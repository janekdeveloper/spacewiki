from flask import Blueprint, render_template, jsonify, request
from utils.helpers import get_planets, ask_ai
from utils.tokenizer import token_required
from models.token import Token
from models.chat import ChatMessage
from database import db

main_bp = Blueprint("main", __name__)

@main_bp.route("/")
def index():
    return render_template("index.html")

@main_bp.route("/classic")
def classic():
    return render_template("classic.html")

@main_bp.route("/realistic")
def realistic():
    return render_template("realistic.html")

@main_bp.route("/json")
def json_api():
    return jsonify(get_planets())

@main_bp.route("/ask", methods=["POST"])
def ask():
    data = request.json
    user_message = data.get("message", "").strip()
    token = request.headers.get("Authorization")  # Получаем токен

    if not user_message:
        return jsonify({"response": "I didn't get that."}), 400

    try:
        bot_reply = ask_ai(user_message)
    except Exception as e:
        print(e)
        bot_reply = "Sorry, I can't respond right now."

    # Если токен есть и он валиден → сохраняем сообщение
    if token:
        token_record = Token.query.filter_by(token=token).first()
        if token_record:
            chat_message = ChatMessage(
                user_id=token_record.user_id, 
                message=user_message, 
                response=bot_reply
            )
            db.session.add(chat_message)
            db.session.commit()

    return jsonify({"response": bot_reply})

@main_bp.route("/chat/history", methods=["GET"])
def get_chat_history():
    token = request.headers.get("Authorization")  # Получаем токен из запроса

    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    token_record = Token.query.filter_by(token=token).first()
    if not token_record:
        return jsonify({"error": "Invalid token"}), 401

    # Получаем последние 20 сообщений пользователя
    messages = ChatMessage.query.filter_by(user_id=token_record.user_id).order_by(ChatMessage.timestamp.asc()).limit(20).all()

    chat_history = [
        {"message": msg.message, "response": msg.response, "timestamp": msg.timestamp.isoformat()}
        for msg in messages
    ]

    return jsonify(chat_history)

