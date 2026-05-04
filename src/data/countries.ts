export type CountryTheme = {
  code: string;
  name: string;
  flag: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  popular?: boolean;
};

export const TOP_SOCIAL_COUNTRIES: CountryTheme[] = [
  { code: "US", name: "United States", flag: "🇺🇸", primaryColor: "#B22234", secondaryColor: "#3C3B6E", accentColor: "#FFFFFF", popular: true },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", primaryColor: "#CE1126", secondaryColor: "#FFFFFF", accentColor: "#CE1126", popular: true },
  { code: "BR", name: "Brazil", flag: "🇧🇷", primaryColor: "#009C3B", secondaryColor: "#FFDF00", accentColor: "#002776", popular: true },
  { code: "MX", name: "Mexico", flag: "🇲🇽", primaryColor: "#006847", secondaryColor: "#CE1126", accentColor: "#FFFFFF", popular: true },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", primaryColor: "#012169", secondaryColor: "#C8102E", accentColor: "#FFFFFF", popular: true },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", primaryColor: "#01411C", secondaryColor: "#FFFFFF", accentColor: "#01411C", popular: true },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", primaryColor: "#006C35", secondaryColor: "#FFFFFF", accentColor: "#006C35", popular: true },
  { code: "KE", name: "Kenya", flag: "🇰🇪", primaryColor: "#BB0000", secondaryColor: "#006600", accentColor: "#000000", popular: true },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", primaryColor: "#008751", secondaryColor: "#FFFFFF", accentColor: "#008751", popular: true },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", primaryColor: "#007A4D", secondaryColor: "#FFB612", accentColor: "#000000", popular: true },
  { code: "IN", name: "India", flag: "🇮🇳", primaryColor: "#FF9933", secondaryColor: "#138808", accentColor: "#000080" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", primaryColor: "#0038A8", secondaryColor: "#CE1126", accentColor: "#FCD116" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", primaryColor: "#DA251D", secondaryColor: "#FFFF00", accentColor: "#DA251D" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", primaryColor: "#A51931", secondaryColor: "#2D2A4A", accentColor: "#FFFFFF" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", primaryColor: "#E30A17", secondaryColor: "#FFFFFF", accentColor: "#E30A17" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", primaryColor: "#CE1126", secondaryColor: "#000000", accentColor: "#C09300" },
  { code: "MA", name: "Morocco", flag: "🇲🇦", primaryColor: "#C1272D", secondaryColor: "#006233", accentColor: "#C1272D" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿", primaryColor: "#006233", secondaryColor: "#D21034", accentColor: "#FFFFFF" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", primaryColor: "#CE1126", secondaryColor: "#006B3F", accentColor: "#FCD116" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", primaryColor: "#1EB53A", secondaryColor: "#00A3DD", accentColor: "#FCD116" },
  { code: "UG", name: "Uganda", flag: "🇺🇬", primaryColor: "#FCDC04", secondaryColor: "#D90000", accentColor: "#000000" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", primaryColor: "#078930", secondaryColor: "#DA121A", accentColor: "#FCDD09" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", primaryColor: "#00A1DE", secondaryColor: "#FAD201", accentColor: "#20603D" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", primaryColor: "#007A5E", secondaryColor: "#CE1126", accentColor: "#FCD116" },
  { code: "CI", name: "Cote d'Ivoire", flag: "🇨🇮", primaryColor: "#F77F00", secondaryColor: "#009E60", accentColor: "#FFFFFF" },
  { code: "SN", name: "Senegal", flag: "🇸🇳", primaryColor: "#00853F", secondaryColor: "#FDEF42", accentColor: "#E31B23" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", primaryColor: "#FF0000", secondaryColor: "#00732F", accentColor: "#000000" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", primaryColor: "#8A1538", secondaryColor: "#FFFFFF", accentColor: "#8A1538" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", primaryColor: "#007A3D", secondaryColor: "#CE1126", accentColor: "#000000" },
  { code: "OM", name: "Oman", flag: "🇴🇲", primaryColor: "#C8102E", secondaryColor: "#007A3D", accentColor: "#FFFFFF" },
  { code: "JO", name: "Jordan", flag: "🇯🇴", primaryColor: "#000000", secondaryColor: "#007A3D", accentColor: "#CE1126" },
  { code: "FR", name: "France", flag: "🇫🇷", primaryColor: "#0055A4", secondaryColor: "#EF4135", accentColor: "#FFFFFF" },
  { code: "DE", name: "Germany", flag: "🇩🇪", primaryColor: "#000000", secondaryColor: "#DD0000", accentColor: "#FFCE00" },
  { code: "IT", name: "Italy", flag: "🇮🇹", primaryColor: "#009246", secondaryColor: "#CE2B37", accentColor: "#FFFFFF" },
  { code: "ES", name: "Spain", flag: "🇪🇸", primaryColor: "#AA151B", secondaryColor: "#F1BF00", accentColor: "#AA151B" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", primaryColor: "#046A38", secondaryColor: "#DA291C", accentColor: "#FFCD00" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", primaryColor: "#AE1C28", secondaryColor: "#21468B", accentColor: "#FFFFFF" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", primaryColor: "#006AA7", secondaryColor: "#FECC00", accentColor: "#006AA7" },
  { code: "NO", name: "Norway", flag: "🇳🇴", primaryColor: "#BA0C2F", secondaryColor: "#00205B", accentColor: "#FFFFFF" },
  { code: "CA", name: "Canada", flag: "🇨🇦", primaryColor: "#D80621", secondaryColor: "#FFFFFF", accentColor: "#D80621" },
  { code: "AU", name: "Australia", flag: "🇦🇺", primaryColor: "#012169", secondaryColor: "#E4002B", accentColor: "#FFFFFF" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", primaryColor: "#00247D", secondaryColor: "#CC142B", accentColor: "#FFFFFF" },
  { code: "JP", name: "Japan", flag: "🇯🇵", primaryColor: "#BC002D", secondaryColor: "#FFFFFF", accentColor: "#BC002D" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", primaryColor: "#CD2E3A", secondaryColor: "#0047A0", accentColor: "#000000" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", primaryColor: "#006A4E", secondaryColor: "#F42A41", accentColor: "#006A4E" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", primaryColor: "#8D153A", secondaryColor: "#FFB700", accentColor: "#00534E" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", primaryColor: "#74ACDF", secondaryColor: "#F6B40E", accentColor: "#FFFFFF" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", primaryColor: "#FCD116", secondaryColor: "#003893", accentColor: "#CE1126" },
  { code: "PE", name: "Peru", flag: "🇵🇪", primaryColor: "#D91023", secondaryColor: "#FFFFFF", accentColor: "#D91023" },
  { code: "CL", name: "Chile", flag: "🇨🇱", primaryColor: "#0039A6", secondaryColor: "#D52B1E", accentColor: "#FFFFFF" },
];

export const POPULAR_SOCIAL_COUNTRIES = TOP_SOCIAL_COUNTRIES.filter(
  (country) => country.popular
);

export const DEFAULT_COUNTRY = TOP_SOCIAL_COUNTRIES.find(
  (country) => country.code === "KE"
)!;
