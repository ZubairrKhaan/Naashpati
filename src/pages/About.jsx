import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaLeaf,
  FaHandshake,
  FaFlask,
  FaGlobeAmericas,
  FaAward,
  FaUsers,
  FaChevronRight,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import { MdVerified, MdNaturePeople, MdEco } from "react-icons/md";

const values = [
  {
    icon: <FaLeaf className="w-7 h-7" />,
    title: "100% Natural",
    description:
      "Every product we carry is free from synthetic additives, preservatives, and harmful chemicals. Nature provides, we deliver.",
  },
  {
    icon: <FaFlask className="w-7 h-7" />,
    title: "Lab Tested",
    description:
      "All herbs and supplements are rigorously tested in certified laboratories to ensure purity, potency, and safety.",
  },
  {
    icon: <FaGlobeAmericas className="w-7 h-7" />,
    title: "Ethically Sourced",
    description:
      "We partner with farmers and cooperatives who share our commitment to sustainable, fair-trade practices worldwide.",
  },
  {
    icon: <FaHandshake className="w-7 h-7" />,
    title: "Customer First",
    description:
      "Your wellness journey is our mission. We stand behind every product with honest guidance and dedicated support.",
  },
];

const stats = [
  { value: "500+", label: "Products" },
  { value: "50K+", label: "Happy Customers" },
  { value: "30+", label: "Countries Sourced" },
  { value: "10+", label: "Years of Expertise" },
];

const certifications = [
  { icon: <MdVerified className="w-6 h-6" />, label: "ISO 22000 Certified" },
  { icon: <MdEco className="w-6 h-6" />, label: "Organic Certified" },
  {
    icon: <FaAward className="w-6 h-6" />,
    label: "Good Manufacturing Practice",
  },
  { icon: <MdNaturePeople className="w-6 h-6" />, label: "Fair Trade Partner" },
];

const factoryStrengths = [
  "Premium Quality",
  "Safe to Use",
  "Superior Efficacy",
];

const factoryLines = [
  "Oils",
  "Tablets",
  "Capsules",
  "Gummies",
  "Syrups",
  "Softgels",
];

const defaultScienceSection = {
  heading: "We Are Backed By Science",
  description:
    "Naashpati delivers high-quality, safe products crafted under expert supervision and aligned with global standards. Committed to GMP, HACCP, ISO systems, and compliance-driven quality controls, we ensure excellence at every stage.",
  badgeImages: [],
  image: "",
};

const defaultWhyNutrifactorSection = {
  heading: "WHY NUTRIFACTOR!",
  description:
    "Nutrifactor stands out from other nutraceutical brands due to our values of transparency and traceability in delivering high-quality natural healthcare products. Our commitment to excellence encompasses sustainable sourcing, integrity across all levels, and rigorous testing methods exceeding usual standard practices. We strive to bridge the gap between consumers and nutraceuticals science by being transparent in our labels. All the health benefits listed on our products are strictly in accordance with the scientific research.",
  image: "",
};

const defaultMissionSection = {
  heading: "Bridging Ancient Wisdom with Modern Wellness",
  description:
    "For centuries, herbal traditions have guided communities toward balance and vitality. At Naashpati, we honour that heritage by making it accessible, transparent, and trustworthy for the modern world. From the highland farms of Morocco to the tropical forests of Sri Lanka, we trace every ingredient back to its origin and share that journey with you because you deserve to know exactly what you're putting in your body.",
  image: "",
};

const defaultHealthPrioritySection = {
  heading: "YOUR HEALTH, OUR PRIORITY",
  items: [
    {
      title: "SUPERIOR MANUFACTURING",
      description:
        "Nutrifactor establishes high-quality manufacturing standards for nutraceutical products, maintaining control over the entire production process with stringent adherence to cGMPs. Our commitment extends to thorough documentation to ensure the traceability of every step.",
    },
    {
      title: "RESEARCH & DEVELOPMENT",
      description:
        "Our research pilot plant stays up-to-date with the latest findings about the natural ingredients and nutraceuticals, which are further supported by our laboratory studies. We rely on scientific research to ensure the authenticity and accuracy of our health-related claims.",
    },
    {
      title: "CURRENT HEALTH CONCERNS",
      description:
        "We focus on the health issues of our consumers by placing their needs at the core of our formulations. Upon identifying current health concerns, we promptly conduct research to develop top-quality natural healthcare products that meet the identified health needs.",
    },
  ],
  images: [],
};

const defaultFacilitySection = {
  heading: "Pakistan's Largest Nutraceutical Manufacturing Facility",
  description:
    "With over a decade of experience, Naashpati specializes in manufacturing nutraceutical and natural healthcare products. Backed by modern laboratories, strict quality protocols, and scalable production systems, we continue to set standards in safety, consistency, and product innovation.",
  images: ["", "", ""],
};

const About = () => {
  const [aboutVideoUrl, setAboutVideoUrl] = useState("");
  const [facilitySection, setFacilitySection] = useState(
    defaultFacilitySection,
  );
  const [scienceSection, setScienceSection] = useState(defaultScienceSection);
  const [whyNutrifactorSection, setWhyNutrifactorSection] = useState(
    defaultWhyNutrifactorSection,
  );
  const [missionSection, setMissionSection] = useState(defaultMissionSection);
  const [healthPrioritySection, setHealthPrioritySection] = useState(
    defaultHealthPrioritySection,
  );
  const [teamMembers, setTeamMembers] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || "/api";
  const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/uploads/")) return `${API_ORIGIN}${url}`;
    return url;
  };

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const response = await fetch(`${API_URL}/about-content`);
        if (!response.ok) {
          return;
        }

        const result = await response.json();
        setAboutVideoUrl(result?.data?.videoUrl || "");
        const remoteImages = Array.isArray(result?.data?.facilityImages)
          ? result.data.facilityImages
          : [];

        const normalizedImages = [0, 1, 2].map(
          (index) =>
            remoteImages[index] || defaultFacilitySection.images[index],
        );

        setFacilitySection({
          heading:
            result?.data?.facilityHeading?.trim() ||
            defaultFacilitySection.heading,
          description:
            result?.data?.facilityDescription?.trim() ||
            defaultFacilitySection.description,
          images: normalizedImages,
        });

        const remoteBadgeImages = Array.isArray(
          result?.data?.scienceBadgeImages,
        )
          ? result.data.scienceBadgeImages
          : [];
        setScienceSection({
          heading:
            result?.data?.scienceHeading?.trim() ||
            defaultScienceSection.heading,
          description:
            result?.data?.scienceDescription?.trim() ||
            defaultScienceSection.description,
          badgeImages: remoteBadgeImages,
          image: result?.data?.scienceImage || "",
        });

        setWhyNutrifactorSection({
          heading:
            result?.data?.whyNutrifactorHeading?.trim() ||
            defaultWhyNutrifactorSection.heading,
          description:
            result?.data?.whyNutrifactorDescription?.trim() ||
            defaultWhyNutrifactorSection.description,
          image: result?.data?.whyNutrifactorImage || "",
        });

        setMissionSection({
          heading:
            result?.data?.missionHeading?.trim() ||
            defaultMissionSection.heading,
          description:
            result?.data?.missionDescription?.trim() ||
            defaultMissionSection.description,
          image: result?.data?.missionImage || "",
        });

        const remoteHealthItems = Array.isArray(
          result?.data?.healthPriorityItems,
        )
          ? result.data.healthPriorityItems
          : [];
        const normalizedHealthItems = [0, 1, 2].map(
          (index) =>
            remoteHealthItems[index] ||
            defaultHealthPrioritySection.items[index],
        );

        setHealthPrioritySection({
          heading:
            result?.data?.healthPriorityHeading?.trim() ||
            defaultHealthPrioritySection.heading,
          items: normalizedHealthItems,
          images: Array.isArray(result?.data?.healthPriorityImages)
            ? result.data.healthPriorityImages
            : [],
        });

        const remoteTeamMembers = Array.isArray(result?.data?.teamMembers)
          ? result.data.teamMembers
          : [];

        setTeamMembers(remoteTeamMembers);
      } catch {
        setAboutVideoUrl("");
        setFacilitySection(defaultFacilitySection);
        setScienceSection(defaultScienceSection);
        setWhyNutrifactorSection(defaultWhyNutrifactorSection);
        setMissionSection(defaultMissionSection);
        setHealthPrioritySection(defaultHealthPrioritySection);
        setTeamMembers([]);
      }
    };

    fetchAboutContent();
  }, [API_URL]);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#f0f7e6] via-[#e8f5d0] to-[#d4edaa] py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-[#68a300] blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-[#4a7a00] blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-[#68a300]/10 text-[#4a7a00] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <FaLeaf className="w-4 h-4" />
            Our Story
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Nature's Best,{" "}
            <span className="text-[#68a300]">Delivered to You</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
            Naashpati was founded on a simple belief — that nature holds the
            answers to vibrant health. We source, test, and deliver the world's
            finest herbs, teas, oils and supplements straight to your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 bg-[#68a300] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#5a8f00] transition-colors"
            >
              <FaLeaf className="w-4 h-4" />
              Explore Products
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-[#68a300] text-[#68a300] font-semibold px-8 py-3 rounded-lg hover:bg-[#68a300] hover:text-white transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      {/* <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-extrabold text-black mb-1">
                {stat.value}
              </p>
              <p className="text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section> */}

      {/* Manufacturing Showcase */}
      {/* <section className="bg-[#ffffff] py-14 lg:py-16">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-wide text-[#68a300] sm:text-6xl">
              NAASHPATI
            </h2>
            <p className="mt-1 text-lg font-semibold tracking-[0.08em] text-gray-600 sm:text-4xl">
              PAKISTAN'S NO.1 HERBAL BRAND
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 items-center gap-4 lg:grid-cols-[180px,minmax(0,1fr),180px]">
            <div className="hidden rounded-[28px] border border-[#d8d6de] bg-[#f3f3f3] p-7 lg:block">
              {factoryStrengths.map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 py-5 ${
                    index !== 0 ? "border-t border-[#d8d6de]" : ""
                  }`}
                >
                  <MdVerified className="h-7 w-7 text-[#5b3f95]" />
                  <span className="text-xl font-semibold uppercase tracking-[0.04em] text-[#4d2f85]">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative mx-auto flex h-[280px] w-full max-w-[1180px] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#cfc9dd] bg-white sm:h-[460px] lg:h-[620px]">
              {aboutVideoUrl ? (
                <video
                  src={resolveMediaUrl(aboutVideoUrl)}
                  controls
                  className="h-full w-full bg-black object-contain"
                />
              ) : (
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#5b3f95] sm:text-2xl">
                    No Content
                  </p>
                  <p className="mt-2 text-sm text-gray-500 sm:text-base">
                    Video is not available right now.
                  </p>
                </div>
              )}
            </div>

            <div className="hidden rounded-[28px] border border-[#d8d6de] bg-[#f3f3f3] p-7 lg:block">
              <div className="flex justify-center pb-4 text-[#5b3f95]">
                <FaChevronUp className="h-5 w-5" />
              </div>
              <div className="space-y-3">
                {factoryLines.map((line) => (
                  <button
                    key={line}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-[#cfc9dd] px-4 py-2.5 text-base font-semibold uppercase tracking-[0.03em] text-[#5b3f95] transition hover:bg-white"
                  >
                    <span>{line}</span>
                    <FaChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 text-[#5b3f95]">
                <FaChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Facility Detail */}
      <section className="bg-[#ffffff] py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
              <div className="overflow-hidden rounded-2xl sm:col-span-2">
                <img
                  src={resolveMediaUrl(facilitySection.images[0])}
                  alt="Nutraceutical production process"
                  className="h-44 w-full object-cover sm:h-52"
                />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={resolveMediaUrl(facilitySection.images[1])}
                  alt="Laboratory quality inspection"
                  className="h-40 w-full object-cover sm:h-44"
                />
              </div>
              <div className="overflow-hidden rounded-2xl sm:col-span-1">
                <img
                  src={resolveMediaUrl(facilitySection.images[2])}
                  alt="Tablet processing conveyor"
                  className="h-40 w-full object-cover sm:h-44"
                />
              </div>
            </div>

            <div className="lg:col-span-6">
              <h3 className="text-[24px] font-extrabold uppercase leading-tight tracking-wide text-[#152238] sm:text-[24px">
                {facilitySection.heading}
              </h3>
              <div className="mt-5 h-1 w-36 rounded-full bg-[#5b3f95]" />
              <p className="mt-6 text-[14px] leading-relaxed text-[#2d3648]">
                {facilitySection.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Science Section */}
      <section className="bg-[#ffffff] py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2">
          <div>
            <h3 className="font-extrabold uppercase tracking-wide text-[#152238] text-[24px]">
              {scienceSection.heading}
            </h3>
            <div className="mt-5 h-1 w-28 rounded-full bg-[#5b3f95]" />
            <p className="mt-6 max-w-xl text-[14px] leading-relaxed text-[#2d3648]">
              {scienceSection.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {scienceSection.badgeImages.map((badgeImage, index) => (
                <div
                  key={`${badgeImage}-${index}`}
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#c8ceda] bg-white shadow-sm"
                >
                  <img
                    src={resolveMediaUrl(badgeImage)}
                    alt={`Certification badge ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[#e1e6ef] bg-gradient-to-br from-[#f4f7fb] to-[#e9eef8] p-2">
            {scienceSection.image ? (
              <img
                src={resolveMediaUrl(scienceSection.image)}
                alt="Science section visual"
                className="h-full min-h-[280px] w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="grid min-h-[280px] place-items-center p-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1f2d44]">
                    No Content
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#61718c]">
                    Section image is not available right now.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Nutrifactor */}
      <section className="bg-[#ffffff] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-5xl text-center">
            <h3 className="font-extrabold uppercase tracking-[0.08em] text-[#152238] text-[24px]">
              {whyNutrifactorSection.heading}
            </h3>
            <div className="mx-auto mt-5 h-1 w-44 rounded-full bg-[#5b3f95]" />
            <p className="mt-6 text-[14px] leading-relaxed text-[#2d3648]">
              {whyNutrifactorSection.description}
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl bg-white shadow-sm">
            {whyNutrifactorSection.image ? (
              <img
                src={resolveMediaUrl(whyNutrifactorSection.image)}
                alt="Why Nutrifactor products"
                className="h-[360px] w-full object-contain sm:h-[430px] lg:h-[520px]"
              />
            ) : (
              <div className="grid h-[360px] place-items-center sm:h-[430px] lg:h-[520px]">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1f2d44]">
                    No Content
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#61718c]">
                    Why Nutrifactor image is not available right now.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-block bg-[#68a300]/10 text-[#4a7a00] text-[12px] font-semibold px-4 py-1.5 rounded-full mb-4">
            Our Mission
          </span>
          <h2 className="font-bold text-gray-900 mb-6 leading-snug text-[24px]">
            {missionSection.heading}
          </h2>
          <p className="text-gray-600 text-[14px] leading-relaxed">
            {missionSection.description}
          </p>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-[#e5e7eb] bg-white">
            {missionSection.image ? (
              <img
                src={resolveMediaUrl(missionSection.image)}
                alt="Our mission visual"
                className="h-[340px] w-full object-cover sm:h-[420px]"
              />
            ) : (
              <div className="grid h-[340px] place-items-center bg-gradient-to-br from-[#f0f7e6] to-[#d4edaa] sm:h-[420px]">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1f2d44]">
                    No Content
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#61718c]">
                    Mission image is not available right now.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#68a300]/10 rounded-2xl -z-10" />
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#68a300]/10 rounded-xl -z-10" />
        </div>
      </section>

      {/* Health Priority */}
      <section className="bg-[#ffffff] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h3 className="font-extrabold uppercase tracking-[0.08em] text-[#152238] text-[24px]">
              {healthPrioritySection.heading}
            </h3>
            <div className="mx-auto mt-5 h-1 w-44 rounded-full bg-[#5b3f95]" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-stretch">
            <div className="space-y-4">
              {healthPrioritySection.items.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="rounded-2xl bg-gray-50 p-5"
                >
                  <h4 className="font-extrabold uppercase tracking-[0.04em] text-[#152238] text-[18px]">
                    {item.title || "No Content"}
                  </h4>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-[#2d3648]">
                    {item.description ||
                      "Section description is not available right now."}
                  </p>
                </article>
              ))}
            </div>

            <div className="grid min-h-[280px] grid-cols-3 grid-rows-2 gap-2.5 lg:h-full lg:min-h-0">
              {[0, 1, 2, 3].map((index) => {
                const slotClass =
                  index === 0
                    ? "col-span-2 row-span-1"
                    : index === 1
                      ? "col-span-1 row-span-1"
                      : index === 2
                        ? "col-span-1 row-span-1"
                        : "col-span-2 row-span-1";
                const imageUrl = healthPrioritySection.images[index];

                return (
                  <div
                    key={`health-priority-image-${index}`}
                    className={`${slotClass} overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white`}
                  >
                    {imageUrl ? (
                      <img
                        src={resolveMediaUrl(imageUrl)}
                        alt={`Health priority visual ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center px-3 text-center">
                        <p className="text-sm font-semibold text-[#61718c]">
                          No Content
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#68a300]/10 text-[#4a7a00] text-[12px] font-semibold px-4 py-1.5 rounded-full mb-4">
              What We Stand For
            </span>
            <h2 className="font-bold text-gray-900 text-[24px]">
              Our Core Values
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-shadow group"
              >
                <div className="w-14 h-14 bg-[#68a300]/10 text-[#68a300] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#68a300] group-hover:text-white transition-colors">
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {v.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="inline-block bg-[#68a300]/10 text-[#4a7a00] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            The People Behind the Plants
          </span>
          <h2 className="font-bold text-gray-900 text-[24px]">Meet Our Team</h2>
        </div>
        {teamMembers.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-10">
            {teamMembers.map((member, index) => (
              <div
                key={`${member.name}-${index}`}
                className="w-full text-center group sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-1.75rem)]"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-5 shadow-medium border border-[#d8e6bf] bg-[#f3f8ea]">
                  {member.image ? (
                    <img
                      src={resolveMediaUrl(member.image)}
                      alt={`${member.name || "Team member"} profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[11px] font-semibold text-[#4a7a00]">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {member.name || "No Content"}
                </h3>
                <p className="text-[#68a300] font-semibold text-sm mb-3">
                  {member.role || "No Content"}
                </p>
                <p className="mx-auto max-w-[18rem] px-1 text-gray-500 leading-relaxed text-sm">
                  {member.bio || "Team member bio is not available right now."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-500">
            No team members added yet.
          </div>
        )}
      </section>

      {/* Certifications */}
      <section className="bg-[#68a300] py-14">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-white font-semibold text-lg mb-10 opacity-90">
            Trusted, certified, and independently verified
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert) => (
              <div
                key={cert.label}
                className="flex flex-col items-center gap-3 bg-white/10 rounded-2xl px-6 py-6 text-white hover:bg-white/20 transition-colors"
              >
                {cert.icon}
                <span className="text-sm font-semibold text-center leading-snug">
                  {cert.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {/* <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <FaUsers className="w-12 h-12 text-[#68a300] mx-auto mb-5 opacity-80" />
        <h2 className="text-4xl font-bold text-gray-900 mb-5">
          Join the Naashpati Community
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          Thousands of people have already made the switch to natural wellness.
          Start your journey today — browse our full range or reach out to our
          specialists.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 bg-[#68a300] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#5a8f00] transition-colors"
          >
            Shop Now
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-lg hover:border-[#68a300] hover:text-[#68a300] transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section> */}
    </div>
  );
};

export default About;
