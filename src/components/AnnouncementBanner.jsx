import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdInfo, MdWarning, MdCheckCircle, MdLocalOffer } from "react-icons/md";
import {
  fetchAnnouncements,
  selectActiveAnnouncements,
} from "../store/slices/announcementSlice";

const MARQUEE_STYLE = `
@keyframes marquee {
  0%   { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(calc(var(--marquee-distance) * -1), 0, 0); }
}
.marquee-track {
  display: flex;
  white-space: nowrap;
  will-change: transform;
  animation: marquee var(--marquee-duration) linear infinite;
}
`;

const typeConfig = {
  info: {
    bg: "bg-blue-200",
    text: "text-blue-600",
    icon: <MdInfo className="text-white text-base flex-shrink-0" />,
  },
  success: {
    bg: "bg-green-200",
    text: "text-green-600",
    icon: <MdCheckCircle className="text-white text-base flex-shrink-0" />,
  },
  warning: {
    bg: "bg-amber-200",
    text: "text-amber-600",
    icon: <MdWarning className="text-white text-base flex-shrink-0" />,
  },
  promo: {
    bg: "bg-[#68a300]",
    text: "text-white",
    icon: <MdLocalOffer className="text-white text-base flex-shrink-0" />,
  },
};

const MarqueeAnnouncement = ({ announcement }) => {
  const containerRef = useRef(null);
  const groupRef = useRef(null);
  const [repeatCount, setRepeatCount] = useState(2);
  const [metrics, setMetrics] = useState({
    distance: 0,
    duration: 28,
  });
  const config = typeConfig[announcement.type] || typeConfig.info;
  const text = announcement.title
    ? `${announcement.title}: ${announcement.message}`
    : announcement.message;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const group = groupRef.current;
    if (!container || !group) return undefined;

    const updateMetrics = () => {
      const containerWidth = container.offsetWidth || 1;
      const groupWidth = group.scrollWidth || 1;
      const nextRepeatCount = Math.max(
        2,
        Math.ceil((containerWidth * 2.5) / groupWidth) * repeatCount,
      );

      if (nextRepeatCount > repeatCount) {
        setRepeatCount(nextRepeatCount);
        return;
      }

      const distance = group.scrollWidth;
      const pixelsPerSecond = 48;

      setMetrics({
        distance,
        duration: Math.max(24, distance / pixelsPerSecond),
      });
    };

    updateMetrics();

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(container);
    resizeObserver.observe(group);

    return () => resizeObserver.disconnect();
  }, [repeatCount, text]);

  const marqueeItems = Array.from({ length: repeatCount });
  const marqueeGroup = (
    <span className="inline-flex">
      {marqueeItems.map((_, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1.5 px-10 ${config.text}`}
        >
          {config.icon}
          {text}
          <span className="ml-10 opacity-40">*</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className={`w-full flex items-center py-1.5 text-sm ${config.bg}`}>
      <div ref={containerRef} className="flex-1 overflow-hidden">
        <div
          className="marquee-track"
          style={{
            "--marquee-distance": `${metrics.distance}px`,
            "--marquee-duration": `${metrics.duration}s`,
          }}
        >
          <span ref={groupRef} className="inline-flex">
            {marqueeGroup}
          </span>
          {marqueeGroup}
        </div>
      </div>
    </div>
  );
};

const AnnouncementBanner = () => {
  const dispatch = useDispatch();
  const announcements = useSelector(selectActiveAnnouncements);

  useEffect(() => {
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  if (announcements.length === 0) return null;

  return (
    <>
      <style>{MARQUEE_STYLE}</style>
      <div className="w-full flex flex-col">
        {announcements.map((announcement) => (
          <MarqueeAnnouncement
            key={announcement._id}
            announcement={announcement}
          />
        ))}
      </div>
    </>
  );
};

export default AnnouncementBanner;
