from flask import Flask
from config import Config
from database import db
from routes.auth import auth_bp
from routes.main import main_bp

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

# Регистрация Blueprint'ов
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(main_bp)

# Создание базы данных, если её нет
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=False, port=8080)
