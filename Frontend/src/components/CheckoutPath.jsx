import React from 'react';
import '../CartStyles/CheckoutPath.css';

const steps = ['Shipping', 'Confirm', 'Payment'];

const CheckoutPath = ({ activeStep = 0 }) => {
  return (
    <div className="checkoutPath">
      {steps.map((label, index) => {
        const completed = index < activeStep;
        const active = index === activeStep;

        return (
          <div
            key={label}
            className="checkoutPath-step"
            completed={completed ? 'true' : 'false'}
            active={active ? 'true' : 'false'}
          >
            <div className="checkoutPath-icon">{index + 1}</div>
            <span className="checkoutPath-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default CheckoutPath;
