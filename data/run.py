from app.__init__ import create_app
import flask
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)