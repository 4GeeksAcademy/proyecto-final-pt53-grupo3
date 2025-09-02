from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Notes, Tags, Comments
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from flask_jwt_extended import create_access_token
from flask_jwt_extended import jwt_required, get_jwt_identity



api = Blueprint('api', __name__)
bcrypt = Bcrypt()

# Permite solicitudes de CORS a esta API
CORS(api, resources={r"/api/*": {"origins": "*"}})


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200

# PAULO Endpoint para crear un nuevo tag


@api.route('/tags', methods=['POST'])
def create_tag():
    body = request.get_json()
    tag_name = body.get('name')
    if not tag_name:
        return jsonify({"msg": "Missing tag name"}), 400
    existing_tag = Tags.query.filter_by(name=tag_name).first()
    if existing_tag:
        return jsonify({"msg": f"Tag '{tag_name}' already exists"}), 409
    new_tag = Tags(name=tag_name)
    db.session.add(new_tag)
    try:
        db.session.commit()
        return jsonify({
            "tag_id": new_tag.tag_id,
            "name": new_tag.name
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error creating tag: {str(e)}"}), 500

# PAULO Endpoint para ver todos los tags


@api.route('/tags', methods=['GET'])
def get_tags():
    all_tags = Tags.query.all()
    serialized_tags = []
    for tag in all_tags:
        serialized_tags.append({
            "tag_id": tag.tag_id,
            "name": tag.name
        })
    return jsonify(serialized_tags), 200

# PAULO Endpoint para obtener todas las notas


@api.route('/notes', methods=['GET'])
def get_notes():
    all_notes = Notes.query.all()
    serialized_notes = []
    for note in all_notes:
        serialized_notes.append({
            "note_id": note.note_id,
            "title": note.title,
            "content": note.content
        })

    return jsonify(serialized_notes), 200

# PAULO Endpoint para obtener todos los comentarios de una nota


@api.route('/notes/<int:note_id>/comments', methods=['GET'])
def get_comments(note_id):
    note = Notes.query.get(note_id)
    if not note:
        return jsonify({"msg": "La nota no existe."}), 404
    comments_list = [comment.serialize() for comment in note.comments]

    return jsonify(comments_list), 200

# PAULO Endpoint para crear una nueva nota
@api.route('/notes', methods=["POST"])
@jwt_required() 
def create_note():
    current_user_id = get_jwt_identity()
    body = request.get_json()
    print("Datos recibidos del frontend:", body)
    required_fields = ['title', 'content', 'tags']
    if not all(field in body for field in required_fields):
        return jsonify({"msg": "Missing required fields"}), 400

    tag_names = body.get('tags')

    if not isinstance(tag_names, list):
        return jsonify({"msg": "Los tags deben ser una lista"}), 400

    new_note = Notes(
        title=body.get('title'),
        content=body.get('content'),
        user_id=current_user_id,
        is_anonymous=False,
    )

    try:
        for tag_name in tag_names:
            tag = Tags.query.filter_by(name=tag_name).first()
            if not tag:
                return jsonify({"msg": f"El tag '{tag_name}' no existe."}), 400
            new_note.tags.append(tag)

        db.session.add(new_note)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"An error occurred: {str(e)}"}), 500

    return jsonify({
        "note_id": new_note.note_id,
        "title": new_note.title,
        "content": new_note.content,
        "user_id": new_note.user_id,
        "tags": [tag.name for tag in new_note.tags]
    }), 201


@api.route('/user', methods=['POST'])
def create_user():

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    username = data.get("username")

    if not all([email, password, first_name, last_name, username]):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if len(password) < 8:
        return jsonify({"error": "La contraseña debe tener al menos 8 caracteres"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "El correo electrónico ya está en uso"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "El nombre de usuario ya está en uso"}), 400


    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    new_user = User(
        email=email,
        #password_hash=password,
        password_hash=hashed_password,
        first_name=first_name,
        last_name=last_name,
        username=username,
        is_active=True
    )

    #hashed_password = bcrypt.generate_password_hash(password)
    #User.password = hashed_password

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Usuario creado exitosamente"}), 201

# Endpoint para obtener todos los usuarios


@api.route('/users', methods=['GET'])
def get_all_users():
    all_users = User.query.all()
    if not all_users:
        return jsonify({"msg": "No se encontraron usuarios"}), 404
    serialized_users = [user.serialize() for user in all_users]
    return jsonify(serialized_users), 200

# PAULO Endpoint para crear un nuevo comentario en una nota


@api.route('/notes/<int:note_id>/comments', methods=["POST"])
@jwt_required()
def create_comment(note_id):
    current_user_id = get_jwt_identity()
    body = request.get_json()
    comment_text = body.get('comment')
    if not comment_text:
        return jsonify({"msg": "El comentario no puede estar vacío."}), 400

    note = Notes.query.get(note_id)
    if not note:
        return jsonify({"msg": "La nota no existe."}), 404

    new_comment = Comments(
        content=comment_text,
        user_id=current_user_id,
        note_id=note_id
    )



@api.route('/token', methods=['POST'])
def create_token():
    
    email = request.json.get("email", None)
    password = request.json.get("password", None)

    
    user = User.query.filter_by(email=email).first()

    if user is None:
        return jsonify({"error": "Email o contraseña invalida"}), 401

    if not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Email o contraseña invalida"}), 401
    
    print(f"ID del usuario para crear el token: {user.id}")
    access_token = create_access_token(identity=user.id)
    print(f"Token generado: {access_token}")
    
    return jsonify(access_token=access_token)

    db.session.add(new_comment)
    try:
        db.session.commit()
        return jsonify({
            "id": new_comment.id,
            "comment": new_comment.comment,
            "user_id": new_comment.user_id,
            "note_id": new_comment.note_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Ocurrió un error inesperado: {str(e)}"}), 500

# PAULO Endpoint para obtener todos los comentarios de una nota
@api.route('/notes/<int:note_id>/comments', methods=['GET'])
def get_comments(note_id):
    note = Notes.query.get(note_id)
    if not note:
        return jsonify({"msg": "La nota no existe."}), 404
    comments_list = [comment.serialize() for comment in note.comments]
    
    return jsonify(comments_list), 200


    #endpoint para perfil


@api.route('/profile', methods=['GET'])
@jwt_required() 
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if user is None:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    return jsonify(id=user.id, username=user.username, first_name=user.first_name, last_name=user.last_name, email=user.email)

