import React from 'react';

export const AdminPageHeader = ({ eyebrow, title, description, meta, actions }) => {
  return (
    <header className="admin-page-header surface-card">
      <div className="admin-page-header__copy">
        {eyebrow ? <p className="admin-page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="admin-page-header__title">{title}</h1>
        {description ? <p className="admin-page-header__description">{description}</p> : null}
        {meta ? <div className="admin-page-header__meta">{meta}</div> : null}
      </div>
      {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
    </header>
  );
};
