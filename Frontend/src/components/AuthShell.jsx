import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LockOutlined, LocalShippingOutlined, ShoppingBagOutlined } from '@mui/icons-material';
import { pickRandomBackground } from '../utils/backgrounds';
import '../UserStyles/Form.css';

const defaultHighlights = [
  {
    icon: ShoppingBagOutlined,
    title: 'Curated discovery',
    description: 'Cleaner browsing, stronger product cards, and smarter recommendations.',
  },
  {
    icon: LocalShippingOutlined,
    title: 'Checkout clarity',
    description: 'Saved addresses, cleaner order review, and faster payment setup.',
  },
  {
    icon: LockOutlined,
    title: 'Trusted payments',
    description: 'Server-validated totals, safer retries, and synchronized order statuses.',
  },
];

const AuthShell = ({
  title,
  eyebrow,
  description,
  children,
  alternateLink,
  backgroundImage,
  highlights = defaultHighlights,
}) => {
  const randomBackground = useMemo(() => backgroundImage || pickRandomBackground(), [backgroundImage]);

  return (
    <div className="auth-shell">
      <section
        className="auth-shell-panel"
        style={{ '--auth-image': `url(${randomBackground})` }}
      >
        <div className="auth-shell-copy">
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </div>
        <div className="auth-shell-highlights">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon fontSize="small" />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="auth-form-shell">
        {alternateLink ? <Link to={alternateLink.to} className="auth-shell-link">{alternateLink.label}</Link> : null}
        {children}
      </section>
    </div>
  );
};

export default AuthShell;
