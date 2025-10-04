from flask import Flask
import flask
from app.api.routes import api_bp
from app.config_env import Config

def create_app():
    app = Flask(__name__)
    #app.config.from_object(Config)
    
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app