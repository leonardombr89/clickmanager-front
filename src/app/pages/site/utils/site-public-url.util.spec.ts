import {
  getUrlClickManager,
  getUrlDominioProprio,
  getUrlPublicaPrincipal,
} from './site-public-url.util';

describe('site-public-url.util', () => {
  it('builds the ClickManager wildcard subdomain URL', () => {
    expect(getUrlClickManager('santa-luzia-acabamentos'))
      .toBe('https://santa-luzia-acabamentos.clickmanager.com.br');
  });

  it('normalizes a custom domain URL', () => {
    expect(getUrlDominioProprio('https://www.SantaLuziaAcabamentos.com.br/catalogo'))
      .toBe('https://santaluziaacabamentos.com.br');
  });

  it('uses a verified custom domain as the main public URL', () => {
    expect(getUrlPublicaPrincipal({
      siteAtivo: true,
      slugPublico: 'santa-luzia-acabamentos',
      dominioCustom: 'santaluziaacabamentos.com.br',
      dominioCustomAtivo: true,
      orcamentoAtivo: true,
      whatsappAtivo: true,
      whatsappExibicao: 'ICONE_TEXTO',
    })).toBe('https://santaluziaacabamentos.com.br');
  });

  it('falls back to the ClickManager subdomain when the custom domain is not active', () => {
    expect(getUrlPublicaPrincipal({
      siteAtivo: true,
      slugPublico: 'santa-luzia-acabamentos',
      dominioCustom: 'santaluziaacabamentos.com.br',
      dominioCustomAtivo: false,
      dominioVerificado: false,
      statusDominio: 'PENDENTE',
      orcamentoAtivo: true,
      whatsappAtivo: true,
      whatsappExibicao: 'ICONE_TEXTO',
    })).toBe('https://santa-luzia-acabamentos.clickmanager.com.br');
  });
});
