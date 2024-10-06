from flask import Flask, render_template

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

if __name__ == '__main__':
    app.run(debug=True)