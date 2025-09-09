from flask import Flask, request, jsonify, url_for, Blueprint, redirect, flash, send_from_directory
from api.models import db, User, Notes, Tags, Comments, Votes
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from flask_jwt_extended import jwt_required, get_jwt_identity
import datetime
import os
from werkzeug.utils import secure_filename

from api.models import UserNoteFavorites
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

api = Blueprint('api', __name__)
bcrypt = Bcrypt()



ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@api.route('/profile/upload-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    current_user_id = get_jwt_identity()

    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    # If user does not select file, browser submits empty file without filename
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if file and allowed_file(file.filename):
        # Create a unique filename using user ID and timestamp
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        filename = f"user_{current_user_id}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
        filename = secure_filename(filename)

        # Ensure upload directory exists
        # Use absolute path to avoid issues with relative paths
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        upload_folder = os.path.join(base_dir, 'src', 'front', 'assets', 'img', 'ProfilePictures')
        
        print(f"📁 Base directory: {base_dir}")
        print(f"📁 Upload folder: {upload_folder}")
        
        if not os.path.exists(upload_folder):
            print(f"📁 Creating upload directory: {upload_folder}")
            os.makedirs(upload_folder, exist_ok=True)

        # Save the file
        file_path = os.path.join(upload_folder, filename)
        print(f"💾 Saving file to: {file_path}")
        file.save(file_path)
        
        # Verify file was saved
        if os.path.exists(file_path):
            print(f"✅ File saved successfully: {file_path}")
            print(f"📏 File size: {os.path.getsize(file_path)} bytes")
        else:
            print(f"❌ File was not saved: {file_path}")

        # Update user's profile_image_url in database
        user = User.query.get(current_user_id)
        if user:
            user.profile_image_url = filename
            db.session.commit()
            print(f"✅ Database updated with filename: {filename}")

        return jsonify({
            "message": "File uploaded successfully",
            "filename": filename,
            "file_path": f"/api/profile/picture/{filename}"
        }), 200
    else:
        return jsonify({"error": "File type not allowed. Only PNG, JPG and JPEG files are allowed."}), 400


@api.route('/profile/picture/<filename>', methods=['GET'])
def get_profile_picture(filename):
    try:
        # Use the same absolute path as in upload
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        upload_folder = os.path.join(base_dir, 'src', 'front', 'assets', 'img', 'ProfilePictures')
        
        # Debug: Check if file exists
        file_path = os.path.join(upload_folder, filename)
        print(f"🔍 Looking for file: {file_path}")
        print(f"🔍 File exists: {os.path.exists(file_path)}")
        print(f"📁 Upload folder: {upload_folder}")
        
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            # List files in directory for debugging
            if os.path.exists(upload_folder):
                files = os.listdir(upload_folder)
                print(f"📋 Files in directory: {files}")
            return jsonify({"error": "File not found"}), 404
            
        print(f"✅ Serving file: {file_path}")
        return send_from_directory(upload_folder, filename)
    except Exception as e:
        print(f"❌ Error serving file: {str(e)}")
        return jsonify({"error": f"Error serving file: {str(e)}"}), 500


@api.route('/profile/my-picture', methods=['GET'])
@jwt_required()
def get_my_profile_picture():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.profile_image_url:
        return jsonify({
            "has_picture": True,
            "filename": user.profile_image_url,
            "file_path": f"/api/profile/picture/{user.profile_image_url}"
        }), 200
    else:
        return jsonify({
            "has_picture": False,
            "message": "No profile picture uploaded"
        }), 200


# CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }
    return jsonify(response_body), 200

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
    try:
        all_notes = Notes.query.all()
        serialized_notes = [note.serialize() for note in all_notes]
        return jsonify(serialized_notes), 200

    except Exception as e:
        print(f"Error en get_notes: {str(e)}")
        return jsonify({"msg": f"Error interno del servidor: {str(e)}"}), 500


@api.route('/notes/search', methods=['GET'])
def search_notes_by_tag():
    tag_query = request.args.get('tag', '').strip()

    # Buscar notas que contengan el tag especificado
    notes_with_tag = Notes.query.join(Notes.tags).filter(
        Tags.name.ilike(f'%{tag_query}%')
    ).distinct().all()

    serialized_notes = [note.serialize() for note in notes_with_tag]
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
@jwt_required()  # un token activo es requerido
def create_note():
    # guardamos el id del user del token en la. variable current_user_ide
    current_user_id = get_jwt_identity()
    body = request.get_json()  # recibimos los datos del front en json
    print("Datos recibidos del frontend:", body)

    required_fields = ['title', 'content', 'tags']  # campos obligatorios
    if not all(field in body for field in required_fields):
        return jsonify({"msg": "Missing required fields"}), 400

    tag_names = body.get('tags')  # esperamos una lista de tags
    # <-- Leemos el campo, con un valor por defecto
    is_anonymous = body.get('is_anonymous', False)

    # validamos que sea una lista y que no este vacia
    if not isinstance(tag_names, list) or not tag_names:
        return jsonify({"msg": "Los tags deben ser una lista no vacía"}), 400

    new_note = Notes(  # creamos una nueva instancia de Notes
        title=body.get('title'),
        content=body.get('content'),
        user_id=current_user_id,
        is_anonymous=is_anonymous,
    )

    try:  # agregamos los tags a la nota
        for tag_name in tag_names:
            # buscamos el tag en la db
            tag = Tags.query.filter_by(name=tag_name).first()
            if not tag:
                return jsonify({"msg": f"El tag '{tag_name}' no existe."}), 400
            new_note.tags.append(tag)  # si existe, lo agregamos a la nota

        db.session.add(new_note)
        db.session.commit()  # guardamos
    except Exception as e:
        # si hay errores nos vamos a 0 para evitar que la informacion se quede en el aire
        db.session.rollback()
        return jsonify({"msg": f"An error occurred: {str(e)}"}), 500

    return jsonify(new_note.serialize()), 201

# endpoint para crear un nuevo usuario


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
        # password_hash=password,
        password_hash=hashed_password,
        first_name=first_name,
        last_name=last_name,
        username=username,
        is_active=True
    )

    # hashed_password = bcrypt.generate_password_hash(password)
    # User.password = hashed_password

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Usuario creado exitosamente"}), 201

# endpoint para login y creacion de token


@api.route('/token', methods=['POST'])
def create_token():

    email = request.json.get("email", None)
    password = request.json.get("password", None)

    user = User.query.filter_by(email=email).first()

    if user is None:
        return jsonify({"error": "Email o contraseña invalida"}), 401

    if not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Email o contraseña invalida"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify(access_token=access_token)

# Endpoint para obtener todos los usuarios


@api.route('/users', methods=['GET'])
def get_all_users():
    all_users = User.query.all()
    if not all_users:
        return jsonify({"msg": "No se encontraron usuarios"}), 404
    serialized_users = [user.serialize() for user in all_users]
    return jsonify(serialized_users), 200

# PAULO Endpoint para crear un nuevo comentario en una nota


@api.route('/notes/<int:note_id>/comments', methods=["POST"])  # deco inicial
@jwt_required()  # deco de token
def create_comment(note_id):
    # guardamos el id del user del token en la. variable current_user_ide
    current_user_id = get_jwt_identity()
    body = request.get_json()  # recibimos los datos del front en json
    # asignamos el contenido de content y lo asignamos en comment_content
    comment_content = body.get('content')
    if not comment_content:  # validamos que no este vacio
        return jsonify({"msg": "El comentario no puede estar vacío."}), 400

    new_comment = Comments(  # si todo es okey, creamos una nueva intancia en la db de comments y basicamente creamso un nuevo comentario
        content=comment_content,
        user_id=current_user_id,
        note_id=note_id
    )
    db.session.add(new_comment)  # nos preparamos par aguardar lo que recibimos
    try:
        db.session.commit()  # guardamos
        return jsonify(new_comment.serialize()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Ocurrió un error inesperado: {str(e)}"}), 500

# MAIN Endpoint para perfil (ahora incluye la bio)


@api.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))

    if user is None:
        return jsonify({"error": "Usuario no encontrado"}), 404

    profile_picture_url = None
    if user.profile_image_url:
        profile_picture_url = f"/api/profile/picture/{user.profile_image_url}"

    return jsonify({
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "bio": user.bio or "",
        "profile_picture_url": profile_picture_url,
        "has_profile_picture": bool(user.profile_image_url)
    })

# MAIN NUEVO ENDPOINT: Obtener notas del usuario actual


@api.route('/profile/notes', methods=['GET'])
@jwt_required()
def get_user_notes():
    try:
        current_user_id = get_jwt_identity()
        user_notes = Notes.query.filter_by(user_id=current_user_id).all()

        serialized_notes = []
        for note in user_notes:
            serialized_notes.append({
                "note_id": note.note_id,
                "title": note.title,
                "content": note.content,
                "created_at": note.created_at.isoformat() if note.created_at else None,
                "tags": [tag.name for tag in note.tags]
            })

        return jsonify(serialized_notes), 200

    except Exception as e:
        return jsonify({"msg": f"Error: {str(e)}"}), 500

# Endpoint para obtener una nota por ID


@api.route('/notes/<int:note_id>', methods=['GET'])
def get_note_by_id(note_id):
    note = Notes.query.get(note_id)
    if not note:
        return jsonify({"msg": "Nota no encontrada"}), 404

    user = User.query.get(note.user_id)
    user_info = None
    if user:
        user_info = {
            "username": user.username,
        }

    serialized_note = {
        "note_id": note.note_id,
        "title": note.title,
        "content": note.content,
        "user_id": note.user_id,
        "is_anonymous": note.is_anonymous,
        "user_info": user_info,  # lo agregamos al resultado serializado
        "tags": [{"tag_id": tag.tag_id, "name": tag.name} for tag in note.tags]
    }

    return jsonify(serialized_note), 200

# Endpoint para actualizar la bio del usuario


@api.route('/profile/bio', methods=['PUT'])
@jwt_required()
def update_user_bio():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    data = request.get_json()
    bio = data.get('bio', '')

    user.bio = bio
    db.session.commit()

    return jsonify({"message": "Bio actualizada exitosamente", "bio": user.bio}), 200

# MAIN NUEVO ENDPOINT: para actualizar un comentario


@api.route('/comments/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(comment_id):
    current_user_id = int(get_jwt_identity())
    body = request.get_json()
    new_content = body.get('comment')

    if not new_content or not new_content.strip():
        return jsonify({"msg": "El comentario no puede estar vacío."}), 400

    comment = Comments.query.get(comment_id)
    if not comment:
        return jsonify({"msg": "Comentario no encontrado."}), 404

    if comment.user_id != current_user_id:
        return jsonify({"msg": "No tienes permiso para editar este comentario."}), 403

    comment.content = new_content
    comment.updated_at = datetime.datetime.utcnow()

    try:
        db.session.commit()
        return jsonify({
            "comment_id": comment.comment_id,
            "note_id": comment.note_id,
            "user_id": comment.user_id,
            "content": comment.content,
            "created_at": comment.created_at.isoformat() if comment.created_at else None,
            "updated_at": comment.updated_at.isoformat() if comment.updated_at else None
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Ocurrió un error al actualizar el comentario: {str(e)}"}), 500

# MAIN NUEVO ENDPOINT: para eliminar un comentario


@api.route('/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    current_user_id = int(get_jwt_identity())
    comment = Comments.query.get(comment_id)
    if not comment:
        return jsonify({"msg": "Comentario no encontrado."}), 404

    if comment.user_id != current_user_id:
        return jsonify({"msg": "No tienes permiso para eliminar este comentario."}), 403

    try:
        db.session.delete(comment)
        db.session.commit()
        return jsonify({"msg": "Comentario eliminado exitosamente."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Ocurrió un error al eliminar el comentario: {str(e)}"}), 500

# endpoint para eliminar una nota


@api.route('/notes/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_note(note_id):
    current_user_id = get_jwt_identity()
    note = Notes.query.get(note_id)

    if not note:
        return jsonify({"msg": "Nota no encontrada"}), 404

    # validamos que sea el propio usuario el que elimina su nota
    if note.user_id != int(current_user_id):
        return jsonify({"msg": "No puedes eliminar notas que no son tuyas"}), 403

    try:
        db.session.delete(note)  # eliminamos
        db.session.commit()  # guardamos
        return jsonify({"msg": "Nota eliminada exitosamente"}), 200
    except Exception as e:
        # si hay errores nos vamos a 0 para evitar que la informacion se quede en el aire
        db.session.rollback()
        return jsonify({"msg": f"Ocurrió un error inesperado: {str(e)}"}), 500

# NUEVO ENDPOINT: Para votar en notas y comentarios


@api.route('/vote', methods=['POST'])
@jwt_required()
def create_vote():
    current_user_id = get_jwt_identity()
    body = request.get_json()

    note_id = body.get('note_id')
    comment_id = body.get('comment_id')
    vote_type = body.get('vote_type')  # 1 para positivo, -1 para negativo

    # Validar que se vote solo en una cosa a la vez
    if not ((note_id and not comment_id) or (comment_id and not note_id)):
        return jsonify({"msg": "Debes votar en una nota o un comentario, no en ambos"}), 400

    if vote_type not in [1, -1]:
        return jsonify({"msg": "Tipo de voto inválido"}), 400

    # Buscar si ya existe un voto de este usuario
    if note_id:
        existing_vote = Votes.query.filter_by(
            user_id=current_user_id,
            note_id=note_id
        ).first()
    else:
        existing_vote = Votes.query.filter_by(
            user_id=current_user_id,
            comment_id=comment_id
        ).first()

    if existing_vote:
        # Si el voto es del mismo tipo, no permitimos votar de nuevo
        if existing_vote.vote_type == vote_type:
            return jsonify({"msg": "Ya has votado de esta forma"}), 400
        else:
            # Si es diferente tipo, lo actualizamos
            existing_vote.vote_type = vote_type
            db.session.commit()
            return jsonify({"msg": "Voto actualizado", "action": "updated"}), 200
    else:
        # Crear nuevo voto
        new_vote = Votes(
            user_id=current_user_id,
            note_id=note_id,
            comment_id=comment_id,
            vote_type=vote_type
        )
        db.session.add(new_vote)
        db.session.commit()
        return jsonify({"msg": "Voto registrado", "action": "added"}), 201

# NUEVO ENDPOINT: Obtener conteo de votos para un elemento


@api.route('/votes/count', methods=['GET'])
def get_votes_count():
    note_id = request.args.get('note_id')
    comment_id = request.args.get('comment_id')

    if not note_id and not comment_id:
        return jsonify({"msg": "Se requiere note_id o comment_id"}), 400

    if note_id:
        positive_votes = Votes.query.filter_by(
            note_id=note_id, vote_type=1).count()
        negative_votes = Votes.query.filter_by(
            note_id=note_id, vote_type=-1).count()
    else:
        positive_votes = Votes.query.filter_by(
            comment_id=comment_id, vote_type=1).count()
        negative_votes = Votes.query.filter_by(
            comment_id=comment_id, vote_type=-1).count()

    return jsonify({
        "positive_votes": positive_votes,
        "negative_votes": negative_votes,
        "total_votes": positive_votes - negative_votes
    }), 200

# NUEVO ENDPOINT: Obtener el voto del usuario actual


@api.route('/votes/my-vote', methods=['GET'])
@jwt_required()
def get_my_vote():
    current_user_id = get_jwt_identity()
    note_id = request.args.get('note_id')
    comment_id = request.args.get('comment_id')

    if not note_id and not comment_id:
        return jsonify({"msg": "Se requiere note_id o comment_id"}), 400

    if note_id:
        vote = Votes.query.filter_by(
            user_id=current_user_id,
            note_id=note_id
        ).first()
    else:
        vote = Votes.query.filter_by(
            user_id=current_user_id,
            comment_id=comment_id
        ).first()

    if vote:
        return jsonify({"vote_type": vote.vote_type}), 200
    else:
        return jsonify({"vote_type": 0}), 200
    


 #----------------------- rutas para lista de favoritos

# Agregar nota a favoritos
@api.route('/favorites/<int:note_id>', methods=['POST'])
@jwt_required()
def add_favorite(note_id):
    current_user_id = get_jwt_identity()
    favorite = UserNoteFavorites.query.filter_by(user_id=current_user_id, note_id=note_id).first()
    if favorite:
        return jsonify({"msg": "Nota ya está en favoritos"}), 400

    note = Notes.query.get(note_id)
    if note is None:
        return jsonify({"msg": "Nota no encontrada"}), 404

    new_fav = UserNoteFavorites(user_id=current_user_id, note_id=note_id)
    db.session.add(new_fav)
    try:
        db.session.commit()
        return jsonify({"msg": "Nota agregada a favoritos"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error interno: {str(e)}"}), 500

# Eliminar nota de favoritos
@api.route('/favorites/<int:note_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(note_id):
    current_user_id = get_jwt_identity()
    favorite = UserNoteFavorites.query.filter_by(user_id=current_user_id, note_id=note_id).first()

    if favorite is None:
        return jsonify({"msg": "Nota no está en favoritos"}), 404

    db.session.delete(favorite)
    try:
        db.session.commit()
        return jsonify({"msg": "Nota removida de favoritos"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error interno: {str(e)}"}), 500

# Obtener lista de notas favoritas del usuario
@api.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    current_user_id = get_jwt_identity()
    favorites = UserNoteFavorites.query.filter_by(user_id=current_user_id).all()

    notes = []
    for fav in favorites:
        note = Notes.query.get(fav.note_id)
        if note:
            notes.append(note.serialize())

    return jsonify(notes), 200


    #------------------ api de google

@api.route('/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    token = data.get("token")

    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), "413075624594-02qpect45v5o3uarjnkr42ldob11s4lk.apps.googleusercontent.com")
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')

        user = User.query.filter_by(email=email).first()
        if not user:
            # Crear usuario si no existe
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                username=email.split('@')[0],
                password_hash="",  # vacío porque no se usará
                is_active=True
            )
            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token), 200

    except ValueError:
        return jsonify({"error": "Token inválido"}), 400