export function whatsappLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const num = cleaned.length === 10 ? `91${cleaned}` : cleaned;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
