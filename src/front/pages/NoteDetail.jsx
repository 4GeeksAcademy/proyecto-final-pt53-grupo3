import React, { useState, useEffect } from "react";
import Comment from "../components/Comment";

const noteDetail = () => {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const noteId = 1;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`https://supreme-space-chainsaw-r4wwrjwvrwxj2ww-3001.app.github.dev/api/notes/${noteId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        } else {
          console.error("Error al obtener los comentarios.");
        }
      } catch (error) {
        console.error("Error en la conexión:", error);
      }
    };
    fetchComments();
  }, [noteId]);

  const handleCommentChange = (e) => {
    setCommentText(e.target.value);
  };

  const handlePostComment = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Debes iniciar sesión para comentar.");
      return;
    }
    if (!commentText.trim()) {
      alert("El comentario no puede estar vacío.");
      return;
    }

    const commentData = {
      comment: commentText,
    };

    try {
      const response = await fetch(`https://supreme-space-chainsaw-r4wwrjwvrwxj2ww-3001.app.github.dev/api/notes/${noteId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(commentData),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([...comments, newComment]);
        setCommentText("");
        alert("Comentario publicado exitosamente.");
      } else {
        const errorData = await response.json();
        alert(`Error al publicar el comentario: ${errorData.msg}`);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("Ocurrió un error inesperado.");
    }
  };

  //esto debe de ser el texto de la nota publicada, la cual deberia de abrirse la hacer
  // clic en la miniatura de la nota en el perfil, pero esa historia no se ha agregado#

  return (
    <div className="row">
      <div className="col-6 m-auto bg-danger-subtle rounded-strong">
        <h1 className="ms-5">Mi primera Nota</h1>
        <p className="m-2">
          Contrary to popular belief, Lorem Ipsum is not simply random text. It
          has roots in a piece of classical Latin literature from 45 BC, making
          it over 2000 years old. Richard McClintock, a Latin professor at
          Hampden-Sydney College in Virginia, looked up one of the more obscure
          Latin words, consectetur, from a Lorem Ipsum passage, and going
          through the cites of the word in classical literature, discovered the
          undoubtable source. Lorem Ipsum comes from sections 1.10.32 and
          1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and
          Evil) by Cicero, written in 45 BC. This book is a treatise on the
          theory of ethics, very popular during the Renaissance. The first line
          of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in
          section 1.10.32. The standard chunk of Lorem Ipsum used since the
          1500s is reproduced below for those interested. Sections 1.10.32 and
          1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also
          reproduced in their exact original form, accompanied by English
          versions from the 1914 translation by H. Rackham.
        </p>
        <div>
          <button type="button" className="btn btn-outline-primary m-1">
            Tag 4
          </button>
        </div>
        <div className="mb-3">
          <label htmlFor="exampleFormControlTextarea1" className="form-label">
            <strong>Agregar un comentario</strong>
          </label>
          <textarea
            className="form-control"
            id="exampleFormControlTextarea1"
            rows="3"
            placeholder="En que estas pensando?"
            value={commentText}
            onChange={handleCommentChange}
          ></textarea>
          <button onClick={handlePostComment} className="btn btn-primary mt-2">
            Publicar
          </button>
        </div>
        <div>
          {comments.map((c) => (
            <Comment key={c.comment_id} commentData={c} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default noteDetail;