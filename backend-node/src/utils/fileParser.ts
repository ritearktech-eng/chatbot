import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const parseFileContent = async (file: Express.Multer.File): Promise<string> => {
    const buffer = file.buffer;
    const mime = file.mimetype;

    if (mime === 'application/pdf') {
        const data = await pdfParse(buffer);
        return data.text;
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } else if (mime === 'text/plain') {
        return buffer.toString('utf-8');
    }
    return '';
};

export const scrapeUrl = async (url: string): Promise<string> => {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        // Remove scripts and styles
        $('script').remove();
        $('style').remove();
        return $('body').text().replace(/\s+/g, ' ').trim();
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        throw new Error('Failed to scrape URL');
    }
};
