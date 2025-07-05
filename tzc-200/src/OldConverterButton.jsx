import React from 'react';

const OldConverterButton = ({ config, className = '' }) => {
  // Don't render anything if config is not loaded yet
  if (!config) {
    return null;
  }

  // Only render if the button is enabled in config
  if (!config?.applicationSettings?.oldConverterButton) {
    return null;
  }

  // Get the destination URL from config - no fallback, config only
  const destinationUrl = config?.applicationSettings?.oldConverterUrl;

  // Don't render if no URL is configured
  if (!destinationUrl) {
    return null;
  }

  // Check if welcome text should be displayed
  const showWelcomeText = config?.applicationSettings?.newConverterText;

  return (
    <div className={`old-converter-button ${className}`}>
      <div className="old-converter-content">
        {showWelcomeText && (
          <div className="welcome-text">
            Welcome to the <span className="new-word">new</span><br />
            Time Zone Converter
          </div>
        )}
        <div className="button-image-container">
          <a href={destinationUrl}>
            <img 
              src="./assets/use-previous-converter.png" 
              alt="Use Previous Converter"
              className="converter-button-img"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default OldConverterButton;
