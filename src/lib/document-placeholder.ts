import { archiveExtensions, documentExtension } from '@/lib/document-formats';
const pdf = { url: '/__l5e/assets-v1/2b8a404f-3414-4dc9-b5d6-3911402934f9/e3f2c139-pdf.webp' };
const word = { url: '/__l5e/assets-v1/97333ca6-ef33-4342-b361-2077fde2c28c/cd164d7b-word.webp' };
const excel = { url: '/__l5e/assets-v1/069aa4e1-1cbc-430c-83b6-d2508d2a2c01/76c3c917-excel.webp' };
const powerpoint = { url: '/__l5e/assets-v1/ca32d2a7-a435-46a8-bb9b-45b473bdfc2c/995dbb07-powerpoint.webp' };
const archive = { url: '/__l5e/assets-v1/c931a22f-a4ee-4d53-8e96-79e00801252d/e3e38388-archive.webp' };
const rtf = { url: '/__l5e/assets-v1/afbdfa1f-ee31-41e7-916c-dc369c845f4a/03dc7ab4-rtf.png' };
const txt = { url: '/__l5e/assets-v1/8dd49af9-bec5-4bce-9295-84a5709b5b4d/cd7794b8-txt.webp' };

const placeholders = { pdf, word, excel, powerpoint, archive, rtf, txt };

export function documentPlaceholder(url: string) {
  const extension = documentExtension(url);
  if (extension === 'pdf') return placeholders.pdf;
  if (['doc', 'docx'].includes(extension)) return placeholders.word;
  if (['xls', 'xlsx'].includes(extension)) return placeholders.excel;
  if (['ppt', 'pptx', 'pps', 'ppsx'].includes(extension)) return placeholders.powerpoint;
  if (extension === 'rtf') return placeholders.rtf;
  if (extension === 'txt') return placeholders.txt;
  if (archiveExtensions.includes(extension)) return placeholders.archive;
  return null;
}
