import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { getMediaUrl } from '@/lib/mediaUtils';

interface VideoThumbnailProps {
  src: string;
  poster?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  title?: string;
  isBlurred?: boolean;
  showPlayButton?: boolean;
}

export const VideoThumbnail = ({ 
  src, 
  poster, 
  alt = "Video", 
  className = "", 
  onClick, 
  onMouseEnter,
  onMouseLeave,
  title,
  isBlurred = false,
  showPlayButton = true
}: VideoThumbnailProps) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        src={getMediaUrl(src)}
        poster={poster}
        preload="metadata"
        muted
        playsInline
        webkit-playsinline="true"
        controls={false}
        disablePictureInPicture
        className={`w-full h-full object-cover cursor-pointer transition-all duration-300 ${
          isBlurred ? 'blur-md' : ''
        }`}
        title={title}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onLoadedData={handleVideoLoad}
        onLoadedMetadata={handleVideoLoad}
        onCanPlay={handleVideoLoad}
        onError={() => {
          console.log('Video failed to load, trying fallback');
          if (!imageError) {
            setImageError(true);
          }
        }}
      />
      
      {/* Fallback Image - caso video não carregue */}
      {imageError && (
        <img
          src={getMediaUrl(src)}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-all duration-300 ${
            isBlurred ? 'blur-md' : ''
          }`}
          title={title}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onError={handleImageError}
        />
      )}

      {/* Play Button Overlay - Sempre visível para melhor UX */}
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors duration-300 pointer-events-none">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/90 hover:bg-white rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg transform hover:scale-110 transition-all duration-200">
            <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-800" />
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {!videoLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 backdrop-blur-sm">
          <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};