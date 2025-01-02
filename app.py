from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)

@app.route('/classic')
def classic():
    return render_template('classic.html')

@app.route('/big')
def big():
    return render_template('index.html')

@app.route('/realistic')
def realistic():
    return render_template('realistic.html')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/json')
def json_api():
    with open('planetinfo.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    return jsonify(data)

if __name__ == '__main__':
    app.run(host = '0.0.0.0', debug=True)
