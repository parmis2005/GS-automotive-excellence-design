import { Helmet } from "react-helmet-async";
import type { SEOData } from "@/utils/seo";
import { generateLocalBusinessSchema, generateVehicleSchema, generateBreadcrumbSchema } from "@/utils/seo";

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
    keywords,
    image,
    url,
    type = "website",
  } = data;

  const baseUrl = "https://www.gs-automobile-rheinland.de";
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
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {fullImageUrl && <meta property="og:image" content={fullImageUrl} />}
      <meta property="og:locale" content="de_DE" />
      <meta property="og:site_name" content="GS Automobile Rheinland" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {fullImageUrl && <meta name="twitter:image" content={fullImageUrl} />}
      
      {/* Structured Data (JSON-LD) */}
      {allStructuredData.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
