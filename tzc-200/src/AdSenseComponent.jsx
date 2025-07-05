import React from 'react';
import { Adsense } from '@ctrl/react-adsense';

const AdSenseComponent = ({ adUnit, className = '' }) => {
  if (!adUnit) return null;

  return (
    <div className={className}>
      <Adsense
        client={adUnit.client}
        slot={adUnit.slot}
        style={{ display: 'block' }}
        format="auto"
        responsive="true"
      />
    </div>
  );
};

export default AdSenseComponent;

