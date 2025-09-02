import { useState } from "react";

const Comment = ({ commentData }) => {
  const [isClicked, setIsClicked] = useState(false);
  const handleIconClick = () => {
    setIsClicked(!isClicked);
  };

  const { username, first_name, last_name, content, created_at } = commentData;
  const formattedDate = new Date(created_at).toLocaleString();

  return (
    <div className="bg-white rounded-strong d-flex mt-3">
      <div className="d-flex flex-column align-items-start justify-content-center mx-2">
        <h4 className="mb-0">{username}</h4>
        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
          {first_name} {last_name}
        </p>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>
          {formattedDate}
        </p>
      </div>
      <div className="flex-grow-1 mx-2">
        <p className="interlineado-compacto">
          {content}
        </p>
      </div>
      <i
        onClick={handleIconClick}
        className={`icono fa-solid fa-heart fa-xl m-auto me-3 ${isClicked ? 'icono-activo' : ''}`}
      ></i>
    </div>
  );
};

export default Comment;