from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Boolean, DateTime, Text, ForeignKey, func, Table
import datetime

db = SQLAlchemy()


class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[str] = mapped_column(String(250), nullable=True)
    profile_image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default='user')
    password_reset_token: Mapped[str] = mapped_column(
        String(255), nullable=True)
    password_reset_expires_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=True)
    last_login_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now())
    notes = db.relationship("Notes", backref="user")
    comments = db.relationship("Comments", backref="user")
    reports = db.relationship("Reports", backref="reporter")
    notifications = db.relationship("Notifications", backref="recipient")
    favorite_notes = db.relationship("UserNoteFavorites", backref="user")
    votes = db.relationship("Votes", backref="user")

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "username": self.username,
            "bio": self.bio,
            # do not serialize the password, its a security breach
        }

 # --- TABLA INTERMEDIA PARA NOTES Y TAGS (Muchos a Muchos) ---
# Esta no es una clase, sino una tabla de asociación.
note_tags = Table('note_tags', db.Model.metadata,
                  db.Column('note_id', Integer, ForeignKey(
                      'notes.note_id'), primary_key=True),
                  db.Column('tag_id', Integer, ForeignKey(
                      'tags.tag_id'), primary_key=True)
                  )


class Notes(db.Model):
    note_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(nullable=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow)
    tags = db.relationship("Tags", secondary=note_tags, backref="notes")
    reports = db.relationship(
        "Reports", backref="note", cascade="all, delete-orphan")
    notifications = db.relationship(
        "Notifications", backref="note", cascade="all, delete-orphan")
    favorited_by = db.relationship(
        "UserNoteFavorites", backref="note", cascade="all, delete-orphan")
    votes = db.relationship("Votes", backref="note",
                            cascade="all, delete-orphan")
    comments = db.relationship(  # para manejar la eliminacion en cascada y que no de error la elimiancion de notas
        "Comments",
        backref="note",
        cascade="all, delete-orphan"
    )

    def serialize(self):
        # Obtener contadores de votos - CORREGIDO (sin import circular)
        positive_votes = sum(1 for vote in self.votes if vote.vote_type == 1)
        negative_votes = sum(1 for vote in self.votes if vote.vote_type == -1)
        
        # Esta es la parte que valida si la nota es anónima o no
        user_info = None
        if not self.is_anonymous:
            # Si no es anónima, incluimos los datos del usuario
            user_info = {
                "id": self.user.id,
                "username": self.user.username,
                "first_name": self.user.first_name,
                "last_name": self.user.last_name,
            }

        return {
            "note_id": self.note_id,
            "user_id": self.user_id,
            "title": self.title,
            "content": self.content,
            "is_anonymous": self.is_anonymous,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "tags": [tag.serialize() for tag in self.tags],
            "comments": [comment.serialize() for comment in self.comments],
            "reports": [report.serialize() for report in self.reports],
            "favorited_by": [fav.serialize() for fav in self.favorited_by],
            "votes": [vote.serialize() for vote in self.votes],
            "user_info": user_info,
            "positive_votes": positive_votes,
            "negative_votes": negative_votes,
            "comments_count": len(self.comments)
        }

class Comments (db.Model):
    comment_id: Mapped[int] = mapped_column(primary_key=True)
    note_id: Mapped[int] = mapped_column(
        ForeignKey("notes.note_id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    content: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    reports = db.relationship(
        "Reports", backref="comment", cascade="all, delete-orphan")
    notifications = db.relationship(
        "Notifications", backref="comment", cascade="all, delete-orphan")
    votes = db.relationship("Votes", backref="comment",
                            cascade="all, delete-orphan")

    def serialize(self):
        return {
            "comment_id": self.comment_id,
            "note_id": self.note_id,
            "user_id": self.user_id,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "username": self.user.username if self.user else "Usuario eliminado",
            "first_name": self.user.first_name if self.user else "",
            "last_name": self.user.last_name if self.user else ""
        }


class Tags(db.Model):
    tag_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    color_hex: Mapped[str] = mapped_column(String(7), nullable=True)

    def serialize(self):
        return {
            "tag_id": self.tag_id,
            "name": self.name
        }


class Reports(db.Model):
    report_id: Mapped[int] = mapped_column(primary_key=True)
    # Un reporte puede ser sobre una nota O un comentario, por eso son opcionales
    note_id: Mapped[int] = mapped_column(
        ForeignKey("notes.note_id"), nullable=True)
    comment_id: Mapped[int] = mapped_column(
        ForeignKey("comments.comment_id"), nullable=True)
    reporter_user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default='pending')
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now())


class Notifications(db.Model):
    notification_id: Mapped[int] = mapped_column(primary_key=True)
    recipient_user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id"), nullable=False)
    # La notificación puede estar relacionada con una nota O un comentario
    note_id: Mapped[int] = mapped_column(
        ForeignKey("notes.note_id"), nullable=True)
    comment_id: Mapped[int] = mapped_column(
        ForeignKey("comments.comment_id"), nullable=True)
    is_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now())


class UserNoteFavorites(db.Model):
    # Clave primaria compuesta para asegurar que un usuario solo pueda guardar una vez la misma nota
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id"), primary_key=True)
    note_id: Mapped[int] = mapped_column(
        ForeignKey("notes.note_id"), primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now())
    
    def serialize(self):
        return {
            "user_id": self.user_id,
            "note_id": self.note_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "username": self.user.username if self.user else None
        }


class Votes(db.Model):
    vote_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    # Un voto puede ser para una nota O un comentario
    note_id: Mapped[int] = mapped_column(
        ForeignKey("notes.note_id"), nullable=True)
    comment_id: Mapped[int] = mapped_column(
        ForeignKey("comments.comment_id"), nullable=True)
    # 1 para voto positivo, -1 para negativo
    vote_type: Mapped[int] = mapped_column(Integer, nullable=False)
    
    def serialize(self):
        return {
            "vote_id": self.vote_id,
            "user_id": self.user_id,
            "note_id": self.note_id,
            "comment_id": self.comment_id,
            "vote_type": self.vote_type
        }