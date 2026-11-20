/**
 * Generated book covers.
 *
 * Every book without a cover image gets one drawn in code: a palette, a layout,
 * a pattern and a type style are chosen from the title and author, and a small
 * emblem says something about the book. Bundled classics name their emblem in
 * the catalogue; other books get one from words in the title, or an abstract
 * ornament. The same book always looks the same and no image is stored.
 * The styles live in styles/covers.css.
 */

import { h } from './dom.js';
import { hashString } from '../core/book.js';

export const COVER_PALETTES = 16;
export const COVER_LAYOUTS = 8;
export const COVER_PATTERNS = 10;
export const COVER_EMBLEMS = 8;

/** Emblems: one path each on a 48 x 48 grid, filled with the even-odd rule. */
export const MOTIFS = {
  ship: 'M5 31L43 31L38 40L10 40ZM23 5L25 5L25 31L23 31ZM26.5 7L39.5 28L26.5 28ZM21.5 11L21.5 28L9.5 28ZM4 44q4-3 8 0t8 0 8 0 8 0 8 0v2H4Z',
  anchor: 'M19.4 8a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0ZM22 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0ZM22.6 12.7L25.4 12.7L25.4 38.4L22.6 38.4ZM14 16.5L22.6 16.5L22.6 19.3L14 19.3ZM25.4 16.5L34 16.5L34 19.3L25.4 19.3ZM7 27C8 36 15 42 24 42C33 42 40 36 41 27L37.4 28C36.4 34 31 38.4 25.4 38.4L22.6 38.4C17 38.4 11.6 34 10.6 28ZM7 27L2.8 33.5L10.6 31.6ZM41 27L45.2 33.5L37.4 31.6Z',
  whale: 'M4 28C4 19 12 15 21 15C30 15 35 19 38 24C40 22 43 20 46 17C46 22 45 26 42 29C40 35 32 39 22 39C12 39 4 35 4 28ZM10.7 27a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0ZM18.4 9.5a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0ZM14.1 7a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0 -2.8 0ZM23.1 7a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0 -2.8 0Z',
  wave: 'M2 16C7 8 12 8 17 16C22 24 27 24 32 16C37 8 42 8 46 14L46 20C42 14 37 14 32 22C27 30 22 30 17 22C12 14 7 14 2 22ZM2 30C7 22 12 22 17 30C22 38 27 38 32 30C37 22 42 22 46 28L46 34C42 28 37 28 32 36C27 44 22 44 17 36C12 28 7 28 2 36Z',
  island: 'M4 43C10 32 38 32 44 43ZM22.4 34.6C22.4 27 24 21 27 16L29.5 17.2C26.6 22 25.6 28 25.6 34.3ZM27.6 15C22 10 16 11 13 16C18 14 23 14 27.6 15ZM29 14.6C30 8 36 5 42 8C37 9 33 11 29 14.6ZM30.4 16.6C37 15 42 19 43 25C39 21 34.6 18 30.4 16.6ZM7.4 9a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0 -7.2 0Z',
  mountain: 'M2 42L17 13L25 28L31 18L46 42ZM17 17.5L20.4 23.6L18.4 22.4L17 24.6L15.4 22.4L13.6 23.6Z',
  tree: 'M24 5C31 5 36 10 36 16C41 17 44 21 44 26C44 31 40 35 34 35L27 35L27 42L21 42L21 35L14 35C8 35 4 31 4 26C4 21 7 17 12 16C12 10 17 5 24 5ZM13 43.5L35 43.5L35 45.3L13 45.3Z',
  leaf: 'M24 4C37 12 40 30 24 44C8 30 11 12 24 4ZM23.4 13L24.6 13L24.6 38L23.4 38ZM24.6 22L31 16L31.8 16.9L24.6 23.7ZM23.4 27L17 21L16.2 21.9L23.4 28.7Z',
  flower: 'M19.3 8.8a4.7 4.7 0 1 0 9.4 0a4.7 4.7 0 1 0 -9.4 0ZM27.1 14.5a4.7 4.7 0 1 0 9.4 0a4.7 4.7 0 1 0 -9.4 0ZM24.1 23.6a4.7 4.7 0 1 0 9.4 0a4.7 4.7 0 1 0 -9.4 0ZM14.5 23.6a4.7 4.7 0 1 0 9.4 0a4.7 4.7 0 1 0 -9.4 0ZM11.5 14.5a4.7 4.7 0 1 0 9.4 0a4.7 4.7 0 1 0 -9.4 0ZM20.7 17a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0 -6.6 0ZM23.2 29.2L24.8 29.2L24.8 45.2L23.2 45.2ZM25.2 39C31 34 36 35 38 38C34 42 29.4 42 25.2 39Z',
  moon: 'M30 5A19 19 0 1 0 43 31A15.5 15.5 0 0 1 30 5ZM38 7.6L39.1 10.9L42.4 12L39.1 13.1L38 16.4L36.9 13.1L33.6 12L36.9 10.9Z',
  sun: 'M15.4 24a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0ZM35.3 22.2L44.5 24L35.3 25.8ZM33.2 30.7L38.5 38.5L30.7 33.2ZM25.8 35.3L24 44.5L22.2 35.3ZM17.3 33.2L9.5 38.5L14.8 30.7ZM12.7 25.8L3.5 24L12.7 22.2ZM14.8 17.3L9.5 9.5L17.3 14.8ZM22.2 12.7L24 3.5L25.8 12.7ZM30.7 14.8L38.5 9.5L33.2 17.3Z',
  star: 'M24 4.5L29.1 18.5L44 19L32.2 28.2L36.3 42.5L24 34.1L11.7 42.5L15.8 28.2L4 19L18.9 18.5Z',
  bolt: 'M28 3L9 27L20 27L16 45L39 19L27.5 19Z',
  candle: 'M24 3C29 9 30.5 12.5 30.5 15.5A6.5 6.5 0 0 1 17.5 15.5C17.5 12.5 19 9 24 3ZM18.5 24.5L29.5 24.5L29.5 40.5L18.5 40.5ZM12 40.5L36 40.5L36 44.5L12 44.5Z',
  snowflake: 'M27.2 24L25.6 26.8L22.4 26.8L20.8 24L22.4 21.2L25.6 21.2ZM25.3 20.4L25.3 5L22.7 5L22.7 20.4ZM32.3 9.6L32 11.6L33.3 13.2L31.3 12.8L29.7 14.1L30 12.1L28.7 10.6L30.7 10.9ZM27.8 23.3L41.1 15.6L39.8 13.4L26.5 21.1ZM40.6 24L38.7 24.7L38 26.6L37.3 24.7L35.4 24L37.3 23.3L38 21.4L38.7 23.3ZM26.5 26.9L39.8 34.6L41.1 32.4L27.8 24.7ZM32.3 38.4L30.7 37.1L28.7 37.4L30 35.9L29.7 33.9L31.3 35.2L33.3 34.8L32 36.4ZM22.7 27.6L22.7 43L25.3 43L25.3 27.6ZM15.7 38.4L16 36.4L14.7 34.8L16.7 35.2L18.3 33.9L18 35.9L19.3 37.4L17.3 37.1ZM20.2 24.7L6.9 32.4L8.2 34.6L21.5 26.9ZM7.4 24L9.3 23.3L10 21.4L10.7 23.3L12.6 24L10.7 24.7L10 26.6L9.3 24.7ZM21.5 21.1L8.2 13.4L6.9 15.6L20.2 23.3ZM15.7 9.6L17.3 10.9L19.3 10.6L18 12.1L18.3 14.1L16.7 12.8L14.7 13.2L16 11.6Z',
  bat: 'M24 17L26.5 11L28.5 16.5C34 12.5 41 13.5 46 19.5C42 19.5 40 21.5 39 24.5C36 22.5 34 23.5 33 26.5C31 24.5 29 25.5 27 29.5L24 35L21 29.5C19 25.5 17 24.5 15 26.5C14 23.5 12 22.5 9 24.5C8 21.5 6 19.5 2 19.5C7 13.5 14 12.5 19.5 16.5L21.5 11Z',
  paw: 'M24 24.5C30 24.5 35 29.5 35 35C35 39.5 31 41.5 27.5 40C25.5 39.1 22.5 39.1 20.5 40C17 41.5 13 39.5 13 35C13 29.5 18 24.5 24 24.5ZM10.2 18.2A4.4 3.4 80 1 0 11.8 26.8A4.4 3.4 80 1 0 10.2 18.2ZM19 9.7A4.8 3.6 90 1 0 19 19.3A4.8 3.6 90 1 0 19 9.7ZM29 9.7A4.8 3.6 90 1 0 29 19.3A4.8 3.6 90 1 0 29 9.7ZM37.8 18.2A4.4 3.4 100 1 0 36.2 26.8A4.4 3.4 100 1 0 37.8 18.2Z',
  horse: 'M13 43H37V40H34C34 32 30 27 31 20C31.5 14 28 9 22 7L19 3.5L17.5 8.5C13 11 10 15 9 20L7 25L9.5 28L15 25.5C17.5 25.5 19.5 24.5 21 22.5C21 28 16 32 16 40H13ZM16.8 14.5a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0Z',
  bird: 'M3 18C9 12 16 13 24 23C32 13 39 12 45 18C38 17 32 21 24 32C16 21 10 17 3 18Z',
  rabbit: 'M13.5 31.5a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0ZM17 23C12.5 15.5 13 6.5 16.5 4C20 6.5 21.6 14 21.2 20.8ZM31 23C35.5 15.5 35 6.5 31.5 4C28 6.5 26.4 14 26.8 20.8ZM18.7 29.5a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0ZM26.7 29.5a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0ZM22.8 33.5L25.2 33.5L24 35.3Z',
  snake: 'M40 6C42 8 42 11 39.5 12.5C37 13.5 35 13 33 12.5C27 10.5 20 11.5 19.5 15C19 18 24 18.8 30 21C38 24 40 32.5 33 36.5C27 40 17 38.5 9.5 33.5L12 29C17 32.5 24 34.5 29 32C33 30 32 26.7 27 25C21 23 14 21 14 15C14 7 25 3 35 6C37 5 39 5 40 6ZM37.1 8.8a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0Z',
  crown: 'M5 37L3.5 15L14.5 24.5L24 8L33.5 24.5L44.5 15L43 37ZM21.6 5a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0ZM5 39L43 39L43 43.5L5 43.5Z',
  sword: 'M24 2L27 8L27 30L21 30L21 8ZM13 30L35 30L35 33.4L13 33.4ZM22 33.4L26 33.4L26 41.4L22 41.4ZM21.3 44.2a2.7 2.7 0 1 0 5.4 0a2.7 2.7 0 1 0 -5.4 0Z',
  castle: 'M5 44V13H9V17H13V13H17V22H21V18H23.5V22H24.5V18H27V22H31V13H35V17H39V13H43V44H28.5V35A4.5 4.5 0 0 0 19.5 35V44ZM9.5 24L12.5 24L12.5 29.5L9.5 29.5ZM35.5 24L38.5 24L38.5 29.5L35.5 29.5Z',
  house: 'M5 25L24 8L43 25H38V42H10V25ZM20.5 31L27.5 31L27.5 42L20.5 42ZM31 8L35 8L35 17.8L31 14.3Z',
  heart: 'M24 43C7 30 3 22 3 15A10.5 10.5 0 0 1 24 12A10.5 10.5 0 0 1 45 15C45 22 41 30 24 43Z',
  key: 'M3.4 24a9.6 9.6 0 1 0 19.2 0a9.6 9.6 0 1 0 -19.2 0ZM8.4 24a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0ZM22.6 22.2L44.6 22.2L44.6 25.8L22.6 25.8ZM36 25.8L39 25.8L39 31.8L36 31.8ZM41 25.8L44.6 25.8L44.6 30L41 30Z',
  skull: 'M24 4C13 4 7 11 7 20C7 25.5 9 29 12.5 31.5V38H35.5V31.5C39 29 41 25.5 41 20C41 11 35 4 24 4ZM12.4 20A4.6 5 0 1 0 21.6 20A4.6 5 0 1 0 12.4 20ZM26.4 20A4.6 5 0 1 0 35.6 20A4.6 5 0 1 0 26.4 20ZM24 25L26.4 30L21.6 30ZM18.3 34L19.7 34L19.7 38L18.3 38ZM23.3 34L24.7 34L24.7 38L23.3 38ZM28.3 34L29.7 34L29.7 38L28.3 38Z',
  mask: 'M8 7H40V21C40 33 33 42 24 42C15 42 8 33 8 21ZM13.5 17C15.5 13.5 20 13.5 22 17C20 19.5 15.5 19.5 13.5 17ZM26 17C28 13.5 32.5 13.5 34.5 17C32.5 19.5 28 19.5 26 17ZM14.5 27C19 36 29 36 33.5 27C28 30 20 30 14.5 27Z',
  quill: 'M41 3C25 5 12 17 10 33L5.5 42.5L8 44L12.8 35.2C27 33 39 21 41 3ZM37 8L38 9L13.6 34.6L12.6 33.8Z',
  column: 'M9 4.5L39 4.5L39 7.5L9 7.5ZM11.5 7.5L36.5 7.5L36.5 10.5L11.5 10.5ZM14 12L18.6 12L18.6 36L14 36ZM21.7 12L26.3 12L26.3 36L21.7 36ZM29.4 12L34 12L34 36L29.4 36ZM11.5 37.5L36.5 37.5L36.5 40.5L11.5 40.5ZM9 40.5L39 40.5L39 44L9 44Z',
  scales: 'M21.5 6.4a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0ZM23 9L25 9L25 38L23 38ZM7 11L23 11L23 13.2L7 13.2ZM25 11L41 11L41 13.2L25 13.2ZM3 27H17A7 5.6 0 0 1 3 27ZM9.2 13.2L10 13.2L4.4 27L3.4 27ZM10 13.2L10.8 13.2L16.6 27L15.6 27ZM31 27H45A7 5.6 0 0 1 31 27ZM37.2 13.2L38 13.2L32.4 27L31.4 27ZM38 13.2L38.8 13.2L44.6 27L43.6 27ZM15 38H33L35 42H13Z',
  compass: 'M3.5 24a20.5 20.5 0 1 0 41 0a20.5 20.5 0 1 0 -41 0ZM6.2 24a17.8 17.8 0 1 0 35.6 0a17.8 17.8 0 1 0 -35.6 0ZM24 8.5L25.5 20.5L30.1 17.9L27.5 22.5L39.5 24L27.5 25.5L30.1 30.1L25.5 27.5L24 39.5L22.5 27.5L17.9 30.1L20.5 25.5L8.5 24L20.5 22.5L17.9 17.9L22.5 20.5ZM22.5 24a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0Z',
  balloon: 'M24 3A14 14 0 0 1 38 17C38 25 31 29 28.5 35H19.5C17 29 10 25 10 17A14 14 0 0 1 24 3ZM20 38.5L28 38.5L28 44.5L20 44.5ZM19.5 35L20.3 35L20.8 38.5L20 38.5ZM27.7 35L28.5 35L28 38.5L27.2 38.5Z',
  windmill: 'M18.5 45L21.8 27.5L26.2 27.5L29.5 45ZM21.6 20a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0ZM24.6 24.2L36 35.6L39.6 32L28.2 20.6ZM19.8 20.6L8.4 32L12 35.6L23.4 24.2ZM23.4 15.8L12 4.4L8.4 8L19.8 19.4ZM28.2 19.4L39.6 8L36 4.4L24.6 15.8Z',
  magnifier: 'M6.5 20a13.5 13.5 0 1 0 27 0a13.5 13.5 0 1 0 -27 0ZM10.4 20a9.6 9.6 0 1 0 19.2 0a9.6 9.6 0 1 0 -19.2 0ZM28.6 30.8L30.8 28.6L44.6 42.4L42.4 44.6Z',
  flask: 'M19 4H29V6.5H27.5V17L38.5 37.5C40 41 38 44 34.5 44H13.5C10 44 8 41 9.5 37.5L20.5 17V6.5H19ZM18.8 35.5a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0ZM25.9 31a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0ZM24.7 39a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0Z',
  coins: 'M9 12A15 5.4 0 1 0 39 12A15 5.4 0 1 0 9 12ZM9 17C9 23.5 39 23.5 39 17V22C39 28.5 9 28.5 9 22ZM9 24.4C9 30.9 39 30.9 39 24.4V29.4C39 35.9 9 35.9 9 29.4ZM9 31.8C9 38.3 39 38.3 39 31.8V36.8C39 43.3 9 43.3 9 36.8Z',
  book: 'M24 12C19 8 12 7 4 9V37C12 35 19 36 24 40C29 36 36 35 44 37V9C36 7 29 8 24 12ZM23.4 13.6L24.6 13.6L24.6 38L23.4 38Z',
  scroll: 'M10 7H37A4.5 4.5 0 0 1 37 16H35V38A5 5 0 0 1 30 43H9A4.5 4.5 0 0 1 9 34H10ZM15 18.5L30 18.5L30 20.1L15 20.1ZM15 24L30 24L30 25.6L15 25.6ZM15 29.5L25 29.5L25 31.1L15 31.1Z',
  hourglass: 'M10 4H38V8H35C35 16 29 20 26.5 24C29 28 35 32 35 40H38V44H10V40H13C13 32 19 28 21.5 24C19 20 13 16 13 8H10ZM17 9.6H31C30 14.6 27 18 24 21.4C21 18 18 14.6 17 9.6Z',
  flag: 'M8.5 4L11.1 4L11.1 45L8.5 45ZM11.1 6C19 3 24 9 31 6.5L41 4.5V23L31 25C24 27.5 19 21.5 11.1 24.5Z',
  ghost: 'M24 4C15 4 10 11 10 20V44L14.7 40L19.3 44L24 40L28.7 44L33.3 40L38 44V20C38 11 33 4 24 4ZM19 16.6A3.4 2.6 90 1 0 19 23.4A3.4 2.6 90 1 0 19 16.6ZM29 16.6A3.4 2.6 90 1 0 29 23.4A3.4 2.6 90 1 0 29 16.6ZM24 25.7A2.8 2.2 90 1 0 24 31.3A2.8 2.2 90 1 0 24 25.7Z',
  wand: 'M5 41.5L7 43.5L25.2 25.3L23.2 23.3ZM33 3L35.8 10.6L43.9 10.9L37.6 16L39.8 23.8L33 19.3L26.2 23.8L28.4 16L22.1 10.9L30.2 10.6ZM11 8.8L12.1 11.9L15.2 13L12.1 14.1L11 17.2L9.9 14.1L6.8 13L9.9 11.9ZM40 31.4L40.9 34.1L43.6 35L40.9 35.9L40 38.6L39.1 35.9L36.4 35L39.1 34.1ZM13 24.4L13.7 26.3L15.6 27L13.7 27.7L13 29.6L12.3 27.7L10.4 27L12.3 26.3Z',
  letter: 'M4 10L44 10L44 38L4 38ZM6.5 12.2L24 26.5L41.5 12.2L42.6 13.6L24 29L5.4 13.6Z',
  note: 'M18 9L38 5V29.5A5.8 4.8 0 1 1 35 25.6V12.3L21 15.1V35.5A5.8 4.8 0 1 1 18 31.6Z',
  frame: 'M6 4L42 4L42 44L6 44ZM10.5 8.5L37.5 8.5L37.5 39.5L10.5 39.5ZM19 20a5 5 0 1 0 10 0a5 5 0 1 0 -10 0ZM14.5 36C14.5 29.5 19 26.6 24 26.6C29 26.6 33.5 29.5 33.5 36Z',
  pot: 'M8 19H40V32A8 8 0 0 1 32 40H16A8 8 0 0 1 8 32ZM10 14.5L38 14.5L38 17.5L10 17.5ZM21 10.5L27 10.5L27 14.5L21 14.5ZM3 21L8 21L8 24.6L3 24.6ZM40 21L45 21L45 24.6L40 24.6Z',
  gear: 'M38.7 21.1L43.4 21.6L43.4 26.4L38.7 26.9L36.4 32.4L39.4 36L36 39.4L32.4 36.4L26.9 38.7L26.4 43.4L21.6 43.4L21.1 38.7L15.6 36.4L12 39.4L8.6 36L11.6 32.4L9.3 26.9L4.6 26.4L4.6 21.6L9.3 21.1L11.6 15.6L8.6 12L12 8.6L15.6 11.6L21.1 9.3L21.6 4.6L26.4 4.6L26.9 9.3L32.4 11.6L36 8.6L39.4 12L36.4 15.6ZM17.8 24a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0Z',
  planet: 'M12.5 24a11.5 11.5 0 1 0 23 0a11.5 11.5 0 1 0 -23 0ZM3.3 31.5A22 6.6 -20 1 0 44.7 16.5A22 6.6 -20 1 0 3.3 31.5ZM7.1 30.2A18 3.4 -20 1 0 40.9 17.8A18 3.4 -20 1 0 7.1 30.2Z',
  laurel: 'M14.8 39.5A3.6 1.7 -18 1 0 21.6 37.3A3.6 1.7 -18 1 0 14.8 39.5ZM26.4 37.3A3.6 1.7 18 1 0 33.2 39.5A3.6 1.7 18 1 0 26.4 37.3ZM9.5 34.6A3.6 1.7 5 1 0 16.6 35.3A3.6 1.7 5 1 0 9.5 34.6ZM31.4 35.3A3.6 1.7 -5 1 0 38.5 34.6A3.6 1.7 -5 1 0 31.4 35.3ZM6.5 28.1A3.6 1.7 28 1 0 12.8 31.5A3.6 1.7 28 1 0 6.5 28.1ZM35.2 31.5A3.6 1.7 -28 1 0 41.5 28.1A3.6 1.7 -28 1 0 35.2 31.5ZM6.2 20.9A3.6 1.7 51 1 0 10.8 26.5A3.6 1.7 51 1 0 6.2 20.9ZM37.2 26.5A3.6 1.7 -51 1 0 41.8 20.9A3.6 1.7 -51 1 0 37.2 26.5ZM8.8 14.2A3.6 1.7 74 1 0 10.8 21.2A3.6 1.7 74 1 0 8.8 14.2ZM37.2 21.2A3.6 1.7 -74 1 0 39.2 14.2A3.6 1.7 -74 1 0 37.2 21.2ZM13.9 9.1A3.6 1.7 97 1 0 13 16.2A3.6 1.7 97 1 0 13.9 9.1ZM35 16.2A3.6 1.7 -97 1 0 34.1 9.1A3.6 1.7 -97 1 0 35 16.2ZM20.5 6.3A3.6 1.7 120 1 0 16.9 12.6A3.6 1.7 120 1 0 20.5 6.3ZM31.1 12.6A3.6 1.7 -120 1 0 27.5 6.3A3.6 1.7 -120 1 0 31.1 12.6ZM21.5 41.5H26.5V43.5H21.5Z',
};

/** Words in a title that suggest an emblem, for books that do not name one. First match wins. */
const TITLE_HINTS = [
  [/\bwhal/, 'whale'],
  [/\b(pirate|buccaneer)/, 'skull'],
  [/\b(island|isle)s?\b/, 'island'],
  [/\b(ship|sail|voyage|mariner|navy|naval|sea)\b/, 'ship'],
  [/\b(river|lake|ocean|waves?|flood)\b/, 'wave'],
  [/\b(mountains?|alps|peak)\b/, 'mountain'],
  [/\b(forest|woods?|jungle|trees?)\b/, 'tree'],
  [/\b(garden|flowers?|rose|lily|blossom)\b/, 'flower'],
  [/\b(christmas|winter|snow|frost|arctic)\b/, 'snowflake'],
  [/\b(moon|nights?|dreams?)\b/, 'moon'],
  [/\b(stars?|astronomy|galaxy)\b/, 'star'],
  [/\b(planets?|mars|space|worlds)\b/, 'planet'],
  [/\b(storm|lightning|thunder|electric)/, 'bolt'],
  [/\b(vampire|dracula)/, 'bat'],
  [/\b(ghosts?|haunt|phantom)/, 'ghost'],
  [/\b(dogs?|wolf|wolves|cats?|animals?|beasts?|lion|tiger|bear)\b/, 'paw'],
  [/\b(horses?|rider|cavalry)\b/, 'horse'],
  [/\b(birds?|raven|nightingale|eagle|swan)\b/, 'bird'],
  [/\b(serpent|snake|dragon)/, 'snake'],
  [/\b(king|queen|prince|princess|emperor|empress|crown)\b/, 'crown'],
  [/\b(war|wars|battle|sword|knight|soldier|army)\b/, 'sword'],
  [/\b(castle|abbey|tower)\b/, 'castle'],
  [/\b(magic|wizard|fairy|fairies|witch)/, 'wand'],
  [/\b(detective|mystery|mysteries|case|clue)\b/, 'magnifier'],
  [/\b(cook|cooking|cookery|kitchen|recipes?)\b/, 'pot'],
  [/\b(music|songs?|ballads?|opera)\b/, 'note'],
  [/\b(painting|painter|picture|portrait|art)\b/, 'frame'],
  [/\b(letters|correspondence)\b/, 'letter'],
  [/\b(machines?|engine|robots?|invention)/, 'gear'],
  [/\b(money|wealth|rich|fortune|gold)\b/, 'coins'],
  [/\b(law|laws|justice|trial)\b/, 'scales'],
  [/\b(science|chemistry|experiments?)\b/, 'flask'],
  [/\b(secrets?)\b/, 'key'],
  [/\b(death|dead|grave|murder)/, 'skull'],
  [/\b(travels?|journey|expedition|adventures?)\b/, 'compass'],
  [/\b(love|heart|wife|husband|bride|marriage)\b/, 'heart'],
  [/\b(house|home|cottage|farm|manor)\b/, 'house'],
  [/\b(poems?|poetry|verses?|sonnets)\b/, 'quill'],
  [/\b(plays?|comedy|tragedy|drama)\b/, 'mask'],
  [/\b(history|chronicles?)\b/, 'scroll'],
  [/\b(time|hours?|years)\b/, 'hourglass'],
];

/** The design of a book's cover, as small numbers that map to CSS classes. */
export function coverDesign(title = '', author = '') {
  const key = `${title}|${author}`.toLowerCase();
  const a = hashString(key);
  const b = hashString(key, 0x9e3779b9);
  const n = String(title).length;
  return {
    palette: 1 + (a % COVER_PALETTES),
    layout: 1 + ((a >>> 8) % COVER_LAYOUTS),
    pattern: 1 + (b % COVER_PATTERNS),
    emblem: 1 + ((b >>> 8) % COVER_EMBLEMS),
    type: 1 + ((b >>> 16) % 3),
    size: n <= 14 ? 1 : n <= 28 ? 2 : n <= 50 ? 3 : 4,
  };
}

/** The emblem for a book: the one it names, else one suggested by its title, else none. */
export function coverMotif(book) {
  const named = book.coverMotif || book.motif;
  if (named && Object.hasOwn(MOTIFS, named)) return named;
  const title = String(book.title || '').toLowerCase();
  const hint = TITLE_HINTS.find(([pattern]) => pattern.test(title));
  return hint ? hint[1] : '';
}

/* The title's box in each layout: its width, and the scale the layout applies to the
   title size. Then the title sizes: four chosen by the title's length and a smaller one
   for titles with a very long word. All in cqw; keep in step with styles/covers.css. */
const TITLE_WIDTH = [72, 82, 82, 80, 76, 63, 68, 82];
const TITLE_SCALE = [1, 1, 0.92, 0.9, 0.94, 1, 0.9, 1];
const TITLE_SIZES = [11.6, 9.8, 8.2, 7, 6];
/* Spaced capitals (type 3 at the two largest sizes): the size factor and the letter-spacing in em. */
const CAPS_SCALE = 0.84;
const CAPS_SPACING = 0.07;

/**
 * The size and type style to set a title in so that no word has to be broken
 * across lines: the design's own if every word fits on a line, else ordinary
 * letters in place of spaced capitals, else the next size down.
 * `measure(word, italic)` gives a word's width in em in the cover's typeface.
 * A word too long even for the smallest size is set at that size and wraps where it must.
 */
export function fitTitle(title, design, measure) {
  // Words end at spaces and hyphens; Chinese, Japanese and Korean may wrap between any two characters.
  const words = String(title).split(/[\s\u2010-\u2014\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef-]+/).filter(Boolean);
  const widest = (italic, caps) => Math.max(0, ...words.map((w) => (caps ? measure(w.toUpperCase(), false) + CAPS_SPACING * w.length : measure(w, italic))));
  const room = TITLE_WIDTH[design.layout - 1] * 0.98;
  for (let size = design.size; size <= TITLE_SIZES.length; size++) {
    const fs = TITLE_SIZES[size - 1] * TITLE_SCALE[design.layout - 1];
    const caps = design.type === 3 && size <= 2;
    if (caps && widest(false, true) * fs * CAPS_SCALE <= room) return { size, type: 3 };
    const type = caps ? 1 : design.type;
    if (widest(type === 2, false) * fs <= room) return { size, type };
  }
  return { size: TITLE_SIZES.length, type: design.type };
}

let ruler;

/** A function that measures words, in em, in the typeface covers are set in (the app's display font). */
function wordRuler() {
  if (ruler === undefined) ruler = document.createElement('canvas').getContext('2d');
  if (!ruler) return () => 0;
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim() || 'serif';
  return (word, italic) => {
    ruler.font = `${italic ? 'italic ' : ''}500 100px ${family}`;
    return ruler.measureText(word).width / 100;
  };
}

const SVG = 'http://www.w3.org/2000/svg';

function motifSvg(name) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute('d', MOTIFS[name]);
  svg.append(path);
  return svg;
}

/** A cover for a book without one. Works at any size: everything scales with the cover's width. */
export function generatedCover(book) {
  const title = book.title || 'Untitled';
  const author = book.author || '';
  const d = coverDesign(title, author);
  const fit = fitTitle(title, d, wordRuler());
  const motif = coverMotif(book);
  return h(
    `div.gen-cover.c-${d.palette}.l-${d.layout}.p-${d.pattern}.e-${d.emblem}.t-${fit.type}.s-${fit.size}`,
    null,
    h('div.gen-art'),
    h(motif ? 'div.gen-emb.m' : 'div.gen-emb', null, motif ? motifSvg(motif) : null),
    h('div.gen-text', null, h('div.gen-title', { text: title }), h('div.gen-rule'), author ? h('div.gen-author', { text: author }) : null)
  );
}
