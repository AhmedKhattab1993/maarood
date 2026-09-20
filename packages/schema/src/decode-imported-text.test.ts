import { describe, it, expect } from 'vitest';
import { decodeImportedText } from './decode-imported-text';

describe('decodeImportedText', () => {
  it('decodes apostrophe numeric entities in titles', () => {
    expect(decodeImportedText("Women&#39;s Cotton Tee")).toBe("Women's Cotton Tee");
    expect(decodeImportedText("Women&#039;s Cotton Tee")).toBe("Women's Cotton Tee");
  });

  it('decodes named ampersand entities', () => {
    expect(decodeImportedText('Pants &amp; Denim')).toBe('Pants & Denim');
  });

  it('strips HTML tags and collapses whitespace', () => {
    expect(decodeImportedText('<p>Pants &amp; Denim</p>')).toBe('Pants & Denim');
    expect(decodeImportedText('  <b>Women&#39;s</b>   Tee  ')).toBe("Women's Tee");
  });

  it('decodes lt, gt, quot, apos, and nbsp', () => {
    expect(decodeImportedText('A &lt;B&gt; &quot;C&quot; &apos;D&apos; E&nbsp;F')).toBe('A <B> "C" \'D\' E F');
  });

  it('decodes decimal and hex numeric entities', () => {
    expect(decodeImportedText('en&#8211;dash')).toBe('en–dash');
    expect(decodeImportedText('hex&#x27;quote')).toBe("hex'quote");
  });

  it('does not rewrite plain brand or product names', () => {
    expect(decodeImportedText('H&M Cotton Tee')).toBe('H&M Cotton Tee');
    expect(decodeImportedText('Zara')).toBe('Zara');
  });

  it('skips invalid code points and surrogates', () => {
    expect(decodeImportedText('keep &#0; zero')).toBe('keep &#0; zero');
    expect(decodeImportedText('keep &#x110000; high')).toBe('keep &#x110000; high');
    expect(decodeImportedText('keep &#55296; surrogate')).toBe('keep &#55296; surrogate');
  });
});
