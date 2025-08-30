"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Notes, Tags
from api.utils import generate_sitemap, APIException
from sqlalchemy import desc
from datetime import datetime

api = Blueprint('api', __name__)

@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }
    return jsonify(response_body), 200

@api.route('/notes', methods=['GET'])
def get_notes():
    """
    GET /notes - Returns all notes ordered by created_at DESC
    """
    try:
        notes = Notes.query.order_by(desc(Notes.created_at)).all()
        
        notes_data = []
        for note in notes:
            note_data = {
                "note_id": note.note_id,
                "user_id": note.user_id,
                "title": note.title,
                "content": note.content,
                "is_anonymous": note.is_anonymous,
                "created_at": note.created_at.isoformat() if note.created_at else None,
                "updated_at": note.updated_at.isoformat() if note.updated_at else None
            }
            notes_data.append(note_data)
            
        return jsonify(notes_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api.route('/notes', methods=['POST'])
def create_note():
    """
    POST /notes - Create a new note
    """
    try:
        data = request.get_json()
        
        print("📨 Received data:", data) 
        
        if not data or 'title' not in data or 'content' not in data:
            return jsonify({"error": "Title and content are required"}), 400
        
        user = User.query.first()
        
        if not user:
            user = User(
                email="temp@example.com",
                username="tempuser",
                password_hash="temp123",
                is_active=True,
                first_name="Temp",
                last_name="User"
            )
            db.session.add(user)
            db.session.commit()
            print(f"Created temporary user with ID: {user.id}")
        
        new_note = Notes(
            user_id=user.id,
            title=data['title'],
            content=data['content'],
            is_anonymous=data.get('is_anonymous', False),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(new_note)
        db.session.commit()
        
        print(f"Note created successfully with ID: {new_note.note_id}")
        
        response_data = {
            "note_id": new_note.note_id,
            "user_id": new_note.user_id,
            "title": new_note.title,
            "content": new_note.content,
            "is_anonymous": new_note.is_anonymous,
            "created_at": new_note.created_at.isoformat() if new_note.created_at else None,
            "updated_at": new_note.updated_at.isoformat() if new_note.updated_at else None,
            "message": "Note created successfully"
        }
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        print(f" ERROR creating note: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@api.route('/users', methods=['POST'])
def create_user():
    """
    POST /users - Create a new user
    """
    try:
        data = request.get_json()
        
        print("📨 Creating user with data:", data) 

        required_fields = ['email', 'username', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Field '{field}' is required"}), 400
        
        existing_user = User.query.filter((User.email == data['email']) | (User.username == data['username'])).first()
        if existing_user:
            return jsonify({"error": "User with this email or username already exists"}), 400
        
        user = User(
            email=data['email'],
            username=data['username'],
            password_hash=data['password'], 
            is_active=True,
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        
        db.session.add(user)
        db.session.commit()
        
        user_data = {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "message": "User created successfully"
        }
        
        return jsonify(user_data), 201
        
    except Exception as e:
        db.session.rollback()
        print(f" ERROR creating user: {str(e)}")
        return jsonify({"error": str(e)}), 500

@api.route('/users', methods=['GET'])
def get_users():
    """
    GET /users - Returns all users
    """
    try:
        users = User.query.all()
        
        users_data = []
        for user in users:
            user_data = {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            users_data.append(user_data)
            
        return jsonify(users_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api.route('/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    """
    DELETE /notes/<id> - Delete a specific note
    """
    try:
        note = Notes.query.get(note_id)
        if not note:
            return jsonify({"error": "Note not found"}), 404
        
        db.session.delete(note)
        db.session.commit()
        
        return jsonify({"message": "Note deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500