import { Helmet } from "react-helmet-async";
import type { SEOData } from "@/utils/seo";
import { generateLocalBusinessSchema, generateBreadcrumbSchema } from "@/utils/seo";

interface SEOProps {
  data: SEOData;
  structuredData?: object | object[];
  breadcrumbs?: Array<{ name: string; url: string }>;
}

/**
 * SEO Component - Handles all meta tags and structured data
 * Usage:
 * <SEO data={seoData} structuredData={schema} />
 */
export default function SEO({ data, structuredData, breadcrumbs }: SEOProps) {
  const {
    title,
    description,
    ogDescription,
    keywords,
    image,
    url,
    type = "website",
    robots,
  } = data;
  const socialDescription = ogDescription ?? description;

  const baseUrl = "https://gsauto.de";
  const fullImageUrl = image?.startsWith("http") ? image : `${baseUrl}${image}`;
  const fullUrl = url?.startsWith("http") ? url : `${baseUrl}${url}`;

  // Prepare structured data array
  const allStructuredData: object[] = [];
  
  // Add provided structured data
  if (structuredData) {
    if (Array.isArray(structuredData)) {
      allStructuredData.push(...structuredData);
    } else {
      allStructuredData.push(structuredData);
    }
  }
  
  // Add breadcrumbs if provided
  if (breadcrumbs && breadcrumbs.length > 0) {
    allStructuredData.push(generateBreadcrumbSchema(breadcrumbs));
  }
  
  // Add LocalBusiness schema for all pages
  allStructuredData.push(generateLocalBusinessSchema());

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      {robots && <meta name="robots" content={robots} />}
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Social Media */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={socialDescription} />
      {fullImageUrl && <meta property="og:image" content={fullImageUrl} />}
      <meta property="og:locale" content="de_DE" />
      <meta property="og:site_name" content="GS Automobile Rheinland GmbH" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={socialDescription} />
      {fullImageUrl && <meta name="twitter:image" content={fullImageUrl} />}

      {/* Preload hero image for faster first paint */}
      {fullImageUrl && <link rel="preload" as="image" href={fullImageUrl} />}
      
      {/* Structured Data (JSON-LD) */}
      {allStructuredData.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
