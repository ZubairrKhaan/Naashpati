import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdInfo, MdWarning, MdCheckCircle, MdLocalOffer } from "react-icons/md";
import {
  fetchAnnouncements,
  selectActiveAnnouncements,
} from "../store/slices/announcementSlice";

const MARQUEE_STYLE = `
@keyframes marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.marquee-track {
  display: flex;
  white-space: nowrap;
  will-change: transform;
  animation: marquee 22s linear infinite;
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
        {announcements.map((announcement) => {
          const config = typeConfig[announcement.type] || typeConfig.info;
          const text = announcement.title
            ? `${announcement.title}: ${announcement.message}`
            : announcement.message;

          return (
            <div
              key={announcement._id}
              className={`w-full flex items-center py-1.5 text-sm ${config.bg}`}
            >
              {/* scrolling area */}
              <div className="flex-1 overflow-hidden">
                <div className="marquee-track">
                  {/* Two identical groups so translateX(-50%) loops seamlessly */}
                  {[0, 1].map((group) => (
                    <span key={group} className="inline-flex">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1.5 px-10 ${config.text}`}
                        >
                          {config.icon}
                          {text}
                          <span className="ml-10 opacity-40">✦</span>
                        </span>
                      ))}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default AnnouncementBanner;
