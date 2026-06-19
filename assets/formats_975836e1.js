// === Format Configurations for REGZEC + PREZEC + JMHZ ===

function getChildByLocalName(parent, localName) {
  if (!parent) return null;
  for (let i = 0; i < parent.childNodes.length; i++) {
    if (parent.childNodes[i].nodeType === 1 && parent.childNodes[i].localName === localName) return parent.childNodes[i];
  }
  return null;
}

function getChildByLocalNameNS(parent, localName, ns) {
  if (!parent) return null;
  for (let i = 0; i < parent.childNodes.length; i++) {
    const ch = parent.childNodes[i];
    if (ch.nodeType === 1 && ch.localName === localName && (!ns || ch.namespaceURI === ns)) return ch;
  }
  return null;
}

function getAllChildrenByLocalNameNS(parent, localName, ns) {
  if (!parent) return [];
  const result = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const ch = parent.childNodes[i];
    if (ch.nodeType === 1 && ch.localName === localName && (!ns || ch.namespaceURI === ns)) result.push(ch);
  }
  return result;
}

const REGZEC_CONFIG = {
  name: 'REGZEC',
  ns: 'http://schemas.cssz.cz/REGZEC/2025',
  rootElement: 'REGZEC',
  rowsContainer: 'employees',
  rowElement: 'employee',
  rowParentElement: null,
  fieldMode: 'attributes',
  hasActions: true,
  hasForeignerFilter: true,
  schemasKey: 'DEFAULT_SCHEMAS',
  sections: [
    // Core sections (all employees)
    { id: 'employee', label: 'Hlavička podání', element: null },
    { id: 'client', label: 'Identifikace', element: 'client' },
    { id: 'client/name', label: 'Jméno a příjmení', element: 'client', child: 'name' },
    { id: 'client/birth', label: 'Narození', element: 'client', child: 'birth' },
    { id: 'client/stat', label: 'Pohlaví a občanství', element: 'client', child: 'stat' },
    { id: 'client/adr', label: 'Trvalé bydliště', element: 'client', child: 'adr' },
    { id: 'client/cdr', label: 'Kontaktní adresa', element: 'client', child: 'cdr' },
    { id: 'comp', label: 'Zaměstnavatel', element: 'comp' },
    { id: 'job', label: 'Pracovní poměr', element: 'job' },
    { id: 'job/prof', label: 'Profese', element: 'job', child: 'prof' },
    { id: 'job/position', label: 'Pozice', element: 'job', child: 'position' },
    { id: 'pens', label: 'Důchod', element: 'pens' },
    { id: 'insh', label: 'Zdravotní pojišťovna', element: 'insh' },
    { id: 'inso', label: 'Současný orgán NP mimo ČSSZ', element: 'inso' },
    { id: 'insp', label: 'Předchozí orgán NP mimo ČSSZ', element: 'insp' },
    { id: 'unemplcomp', label: 'Podpora v nezaměstnanosti', element: 'unemplcomp' },
    { id: 'unemplcomp/pensionperiod', label: 'Interval důchodového pojištění', element: 'unemplcomp', child: 'pensionperiod', repeating: true },
    { id: 'fact', label: 'Další údaje', element: 'fact' },
    { id: 'fact/healtrest', label: 'Zdravotní omezení', element: 'fact', child: 'healtrest' },
    { id: 'forinreg', label: 'Cizí právní předpisy', element: 'forinreg' },
    { id: 'attachs', label: 'Přílohy', element: 'attachs', _custom: 'attachments' },
    // Foreigner/conditional sections (at end)
    { id: 'client/fdr', label: 'Pobyt v ČR', element: 'client', child: 'fdr', _foreign: true },
    { id: 'client/rdr', label: 'Adresa rezidence', element: 'client', child: 'rdr', _foreign: true },
    { id: 'client/taxidrezid', label: 'Daňová identifikace', element: 'client', child: 'taxidrezid', _foreign: true },
    { id: 'client/proofid', label: 'Doklad totožnosti', element: 'client', child: 'proofid', _foreign: true },
    { id: 'forin', label: 'Cizozemský nositel pojištění', element: 'forin', _foreign: true },
    { id: 'nocitizen', label: 'Cizinec – pracovní oprávnění', element: 'nocitizen', _foreign: true },
  ],
  fields: [
    // Core fields (all employees)
    { section: 'employee', attr: 'sqnr', csszId: null, label: 'Pořadové číslo věty', type: 'number' },
    { section: 'employee', attr: 'dep', csszId: '10004', label: 'Číslo OSSZ', type: 'text', maxLength: 3 },
    { section: 'employee', attr: 'act', csszId: '10008', label: 'Číslo akce', type: 'number' },
    { section: 'employee', attr: 'dat', csszId: '10005', label: 'Datum vyplnění', type: 'date' },
    { section: 'employee', attr: 'fro', csszId: '10009', label: 'Platnost akce ke dni', type: 'date' },
    { section: 'client', attr: 'bno', csszId: '10057', label: 'Rodné číslo / EČP', type: 'text', maxLength: 10 },
    { section: 'client', attr: 'ikmpsv', csszId: '10051', label: 'IK MPSV (OIČ)', type: 'text', maxLength: 10 },
    { section: 'client', attr: 'vcp', csszId: '10060', label: 'VČP', type: 'text', maxLength: 20 },
    { section: 'client/name', attr: 'sur', csszId: '10053', label: 'Příjmení', type: 'text', maxLength: 50 },
    { section: 'client/name', attr: 'fir', csszId: '10054', label: 'Jméno', type: 'text', maxLength: 50 },
    { section: 'client/name', attr: 'tit', csszId: '10055', label: 'Titul', type: 'text', maxLength: 35 },
    { section: 'client/name', attr: 'ona', csszId: '10064', label: 'Dřívější příjmení', type: 'text', maxLength: 50 },
    { section: 'client/birth', attr: 'dat', csszId: '10056', label: 'Datum narození', type: 'date' },
    { section: 'client/birth', attr: 'nam', csszId: '10063', label: 'Rodné příjmení', type: 'text', maxLength: 50 },
    { section: 'client/birth', attr: 'cit', csszId: '10066', label: 'Místo narození', type: 'text', maxLength: 50 },
    { section: 'client/birth', attr: 'stat', csszId: '10065', label: 'Stát narození', type: 'text', maxLength: 2 },
    { section: 'client/stat', attr: 'mal', csszId: '10059', label: 'Pohlaví', type: 'text', maxLength: 1 },
    { section: 'client/stat', attr: 'cnt', csszId: '10067', label: 'Státní občanství', type: 'text', maxLength: 2 },
    { section: 'client/adr', attr: 'str', csszId: '10077', label: 'Ulice', type: 'text', maxLength: 50 },
    { section: 'client/adr', attr: 'num', csszId: '10078', label: 'Číslo popisné', type: 'text', maxLength: 12 },
    { section: 'client/adr', attr: 'onum', csszId: '10079', label: 'Číslo orientační', type: 'text', maxLength: 12 },
    { section: 'client/adr', attr: 'pnu', csszId: '10082', label: 'PSČ', type: 'text', maxLength: 11 },
    { section: 'client/adr', attr: 'cit', csszId: '10080', label: 'Obec', type: 'text', maxLength: 50 },
    { section: 'client/adr', attr: 'cnt', csszId: '10083', label: 'Stát', type: 'text', maxLength: 2 },
    { section: 'client/adr', attr: 'ruianpoint', csszId: '10076', label: 'Kód RUIAN', type: 'number' },
    { section: 'client/cdr', attr: 'str', csszId: '10506', label: 'Ulice', type: 'text', maxLength: 50 },
    { section: 'client/cdr', attr: 'num', csszId: '10507', label: 'Číslo popisné', type: 'text', maxLength: 12 },
    { section: 'client/cdr', attr: 'onum', csszId: '10508', label: 'Číslo orientační', type: 'text', maxLength: 12 },
    { section: 'client/cdr', attr: 'pnu', csszId: '10510', label: 'PSČ', type: 'text', maxLength: 11 },
    { section: 'client/cdr', attr: 'cit', csszId: '10509', label: 'Obec', type: 'text', maxLength: 50 },
    { section: 'client/cdr', attr: 'cnt', csszId: '10511', label: 'Stát', type: 'text', maxLength: 2 },
    { section: 'client/cdr', attr: 'ruianpoint', csszId: '10505', label: 'Kód RUIAN', type: 'number' },
    { section: 'comp', attr: 'vs', csszId: '10221', label: 'Variabilní symbol', type: 'text', maxLength: 10 },
    { section: 'comp', attr: 'nvs', csszId: '10222', label: 'Nový variabilní symbol', type: 'text', maxLength: 10 },
    { section: 'comp', attr: 'nam', csszId: '10120', label: 'Název zaměstnavatele', type: 'text', maxLength: 150 },
    { section: 'job', attr: 'oid', csszId: '10228', label: 'ID pojistného vztahu', type: 'text', maxLength: 22 },
    { section: 'job', attr: 'fro', csszId: '10223', label: 'Datum nástupu', type: 'date' },
    { section: 'job', attr: 'to', csszId: '10224', label: 'Datum skončení', type: 'date' },
    { section: 'job', attr: 'rel', csszId: '10239', label: 'Druh činnosti', type: 'text', maxLength: 2 },
    { section: 'job', attr: 'relDetail', csszId: '10502', label: 'Bližší určení PPV', type: 'number' },
    { section: 'job', attr: 'sme', csszId: '10243', label: 'Malý rozsah', type: 'boolean' },
    { section: 'job', attr: 'endbydeath', csszId: '10225', label: 'Ukončeno smrtí', type: 'boolean' },
    { section: 'job', attr: 'notstart', csszId: '10226', label: 'Zaměstnanec nenastoupil', type: 'boolean' },
    { section: 'job', attr: 'contractfro', csszId: '10227', label: 'Vznik zaměstnání', type: 'date' },
    { section: 'job', attr: 'relat', csszId: '10249', label: 'Postavení v zaměstnání', type: 'number' },
    { section: 'job', attr: 'workmode', csszId: '10255', label: 'Pracovní režim', type: 'number' },
    { section: 'job', attr: 'cont', csszId: '10407', label: 'Nepřetržitý provoz', type: 'boolean' },
    { section: 'job', attr: 'place', csszId: '10258', label: 'Práce probíhá převážně', type: 'number' },
    { section: 'job', attr: 'preplace', csszId: '10526', label: 'Předpokládané místo výkonu', type: 'text', maxLength: 500 },
    { section: 'job', attr: 'contractplace', csszId: '10527', label: 'Místo výkonu práce (smlouva)', type: 'text', maxLength: 200 },
    { section: 'job', attr: 'cit', csszId: '10528', label: 'Název obce', type: 'text', maxLength: 50 },
    { section: 'job', attr: 'municode', csszId: '10529', label: 'Kód obce', type: 'text', maxLength: 6 },
    { section: 'job/prof', attr: 'clas', csszId: '10234', label: 'Kód profese', type: 'text', maxLength: 5 },
    { section: 'job/prof', attr: 'edu', csszId: '10248', label: 'Vzdělání pro profesi', type: 'text', maxLength: 1 },
    { section: 'job/position', attr: 'name', csszId: '10235', label: 'Název pozice', type: 'text', maxLength: 100 },
    { section: 'job/position', attr: 'lead', csszId: '10238', label: 'Vedoucí zaměstnanec', type: 'boolean' },
    { section: 'pens', attr: 'typ', csszId: '10113', label: 'Druh důchodu', type: 'text', maxLength: 1 },
    { section: 'pens', attr: 'tak', csszId: '10114', label: 'Důchod pobírán od', type: 'date' },
    { section: 'pens', attr: 'early', csszId: '10115', label: 'Předčasný důchod', type: 'boolean' },
    { section: 'pens', attr: 'reducedAge', csszId: '10504', label: 'Snížený důchodový věk', type: 'boolean' },
    { section: 'insh', attr: 'cnr', csszId: '10102', label: 'Kód zdravotní pojišťovny', type: 'number' },
    { section: 'inso', attr: 'nam', csszId: '10103', label: 'Název orgánu', type: 'text', maxLength: 100 },
    { section: 'insp', attr: 'nam', csszId: '10104', label: 'Název orgánu', type: 'text', maxLength: 100 },
    { section: 'unemplcomp', attr: 'rsn', csszId: '10376', label: 'Důvod neposkytnutí', type: 'number' },
    { section: 'unemplcomp', attr: 'typeempl', csszId: '10525', label: 'Druh zaměstnání', type: 'number' },
    { section: 'unemplcomp', attr: 'avgmonear', csszId: '10377', label: 'Průměrný čistý výdělek', type: 'number' },
    { section: 'unemplcomp', attr: 'belong', csszId: '10378', label: 'Nárok na odstupné', type: 'boolean' },
    { section: 'unemplcomp', attr: 'fullpay', csszId: '10379', label: 'Vyplaceno v plné výši', type: 'boolean' },
    { section: 'unemplcomp', attr: 'rsnterempl', csszId: '10380', label: 'Důvod ukončení PPV', type: 'number' },
    { section: 'unemplcomp', attr: 'rsnterrel', csszId: '10381', label: 'Důvod ukončení sl. poměru', type: 'number' },
    { section: 'unemplcomp', attr: 'replacement', csszId: '10530', label: 'Jednorázová náhrada §271ca', type: 'number' },
    { section: 'unemplcomp', attr: 'goldenhandshake', csszId: '10531', label: 'Odstupné §67', type: 'number' },
    { section: 'unemplcomp', attr: 'severancepay', csszId: '10532', label: 'Odchodné', type: 'number' },
    { section: 'unemplcomp', attr: 'disposal', csszId: '10533', label: 'Odbytné', type: 'number' },
    { section: 'unemplcomp', attr: 'earlyterm', csszId: '10534', label: 'Důvod předčasného ukončení', type: 'number' },
    { section: 'unemplcomp/pensionperiod', attr: 'fro', csszId: '10386', label: 'Pojištění od', type: 'date' },
    { section: 'unemplcomp/pensionperiod', attr: 'to', csszId: '10387', label: 'Pojištění do', type: 'date' },
    { section: 'fact', attr: 'ztp', csszId: '10090', label: 'Držitel ZTP/P', type: 'boolean' },
    { section: 'fact', attr: 'highedu', csszId: '10091', label: 'Vzdělání KKOV', type: 'text', maxLength: 1 },
    { section: 'fact/healtrest', attr: 'type', csszId: '10085', label: 'Typ zdravotního omezení', type: 'number' },
    { section: 'fact/healtrest', attr: 'fro', csszId: '10086', label: 'Zdravotní omezení od', type: 'date' },
    { section: 'fact/healtrest', attr: 'to', csszId: '10087', label: 'Zdravotní omezení do', type: 'date' },
    { section: 'forinreg', attr: 'juris', csszId: '10427', label: 'Cizí právní předpisy', type: 'boolean' },
    { section: 'forinreg', attr: 'state', csszId: '10428', label: 'Kód státu', type: 'text', maxLength: 2 },
    // Foreigner/conditional fields (at end)
    { section: 'client/fdr', attr: 'str', csszId: '10513', label: 'Ulice', type: 'text', maxLength: 50 },
    { section: 'client/fdr', attr: 'num', csszId: '10514', label: 'Číslo popisné', type: 'number' },
    { section: 'client/fdr', attr: 'onum', csszId: '10515', label: 'Číslo orientační', type: 'text', maxLength: 12 },
    { section: 'client/fdr', attr: 'pnu', csszId: '10517', label: 'PSČ', type: 'text', maxLength: 5 },
    { section: 'client/fdr', attr: 'cit', csszId: '10516', label: 'Obec', type: 'text', maxLength: 50 },
    { section: 'client/fdr', attr: 'ruianpoint', csszId: '10512', label: 'Kód RUIAN', type: 'number' },
    { section: 'client/rdr', attr: 'str', csszId: '10519', label: 'Ulice', type: 'text', maxLength: 50 },
    { section: 'client/rdr', attr: 'num', csszId: '10520', label: 'Číslo popisné', type: 'text', maxLength: 12 },
    { section: 'client/rdr', attr: 'onum', csszId: '10521', label: 'Číslo orientační', type: 'text', maxLength: 12 },
    { section: 'client/rdr', attr: 'pnu', csszId: '10522', label: 'PSČ', type: 'text', maxLength: 11 },
    { section: 'client/rdr', attr: 'cit', csszId: '10523', label: 'Obec', type: 'text', maxLength: 50 },
    { section: 'client/rdr', attr: 'cnt', csszId: '10524', label: 'Stát', type: 'text', maxLength: 2 },
    { section: 'client/taxidrezid', attr: 'type', csszId: '10061', label: 'Typ daňové identifikace', type: 'text', maxLength: 1 },
    { section: 'client/taxidrezid', attr: 'num', csszId: '10062', label: 'Daňový identifikátor', type: 'text', maxLength: 20 },
    { section: 'client/taxidrezid', attr: 'stat', csszId: '10068', label: 'Kód státu rezidentství', type: 'text', maxLength: 2 },
    { section: 'client/taxidrezid', attr: 'statchang', csszId: '10459', label: 'Platnost změny od', type: 'date' },
    { section: 'client/proofid', attr: 'type', csszId: '10069', label: 'Typ dokladu', type: 'text', maxLength: 2 },
    { section: 'client/proofid', attr: 'num', csszId: '10070', label: 'Číslo dokladu', type: 'text', maxLength: 20 },
    { section: 'client/proofid', attr: 'foreigninst', csszId: '10071', label: 'Vydal (orgán v zahraničí)', type: 'text', maxLength: 100 },
    { section: 'client/proofid', attr: 'stat', csszId: '10072', label: 'Stát vydání', type: 'text', maxLength: 2 },
    { section: 'forin', attr: 'cur', csszId: '10092', label: 'Specifikace', type: 'text', maxLength: 1 },
    { section: 'forin', attr: 'nam', csszId: '10093', label: 'Název nositele', type: 'text', maxLength: 100 },
    { section: 'forin', attr: 'str', csszId: '10094', label: 'Ulice', type: 'text', maxLength: 50 },
    { section: 'forin', attr: 'num', csszId: '10095', label: 'Č.p.', type: 'text', maxLength: 12 },
    { section: 'forin', attr: 'onum', csszId: '10096', label: 'Č.o.', type: 'text', maxLength: 12 },
    { section: 'forin', attr: 'pnu', csszId: '10098', label: 'PSČ', type: 'text', maxLength: 11 },
    { section: 'forin', attr: 'cit', csszId: '10097', label: 'Obec', type: 'text', maxLength: 50 },
    { section: 'forin', attr: 'cnt', csszId: '10099', label: 'Stát', type: 'text', maxLength: 2 },
    { section: 'forin', attr: 'id', csszId: '10100', label: 'Číslo pojištění', type: 'text', maxLength: 25 },
    { section: 'forin', attr: 'sec', csszId: '10101', label: 'Sektor pojištění', type: 'text', maxLength: 2 },
    { section: 'nocitizen', attr: 'freeacc', csszId: '10414', label: 'Volný přístup na trh práce', type: 'boolean' },
    { section: 'nocitizen', attr: 'perm', csszId: '10105', label: 'Důvod volného přístupu', type: 'number' },
    { section: 'nocitizen', attr: 'permtype', csszId: '10106', label: 'Druh pracovního oprávnění', type: 'number' },
    { section: 'nocitizen', attr: 'issue', csszId: '10107', label: 'Krajská pobočka ÚP', type: 'text', maxLength: 3 },
    { section: 'nocitizen', attr: 'permid', csszId: '10108', label: 'Identifikátor oprávnění', type: 'text', maxLength: 20 },
    { section: 'nocitizen', attr: 'permfro', csszId: '10109', label: 'Oprávnění od', type: 'date' },
    { section: 'nocitizen', attr: 'permto', csszId: '10110', label: 'Oprávnění do', type: 'date' },
  ],
  actionLabels: { '1': 'A1 Přihláška', '2': 'A2 Odhláška', '3': 'A3 Změna', '4': 'A4 Oprava', '8': 'A8 Storno' },
  actionSections: {
    '': null,
    '1': null,
    '2': ['employee', 'client', 'client/name', 'comp', 'job', 'unemplcomp', 'unemplcomp/pensionperiod', 'attachs'],
    '3': ['employee', 'client', 'client/name', 'client/birth', 'client/stat', 'client/adr', 'client/cdr', 'comp', 'job', 'job/prof', 'job/position', 'pens', 'insh', 'fact', 'fact/healtrest', 'forinreg', 'client/fdr', 'client/rdr', 'client/taxidrezid', 'client/proofid', 'nocitizen', 'attachs'],
    '4': null,
    '8': ['employee', 'client', 'comp', 'job', 'attachs'],
  },
  fieldRules: {
    // employee header
    '10004': { '1':'P','2':'P','3':'P','4':'P','8':'P' },
    '10008': { '1':'P','2':'P','3':'P','4':'P','8':'P' },
    '10005': { '1':'P','2':'P','3':'P','4':'P','8':'P' },
    '10009': { '1':'/','2':'/','3':'P','4':'P','8':'/' },
    // client
    '10057': { '1':'PP','2':'PP','3':'PP','4':'PP','8':'PP' },
    '10051': { '1':'N','2':'P','3':'P','4':'P','8':'P' },
    '10060': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    // client/taxidrezid
    '10061': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10062': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10068': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    '10459': { '1':'/','2':'/','3':'PP','4':'PP','8':'/' },
    // client/proofid
    '10069': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10070': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10071': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10072': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    // client/name
    '10053': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    '10054': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    '10055': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    '10064': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    // client/birth
    '10056': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    '10063': { '1':'P','2':'/','3':'/','4':'N','8':'/' },
    '10066': { '1':'P','2':'/','3':'/','4':'N','8':'/' },
    '10065': { '1':'P','2':'/','3':'/','4':'N','8':'/' },
    // client/stat
    '10059': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    '10067': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    // client/adr
    '10077': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    '10078': { '1':'P','2':'/','3':'PP','4':'PP','8':'/' },
    '10079': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    '10082': { '1':'P','2':'/','3':'PP','4':'PP','8':'/' },
    '10080': { '1':'P','2':'/','3':'PP','4':'PP','8':'/' },
    '10083': { '1':'P','2':'/','3':'PP','4':'PP','8':'/' },
    '10076': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    // client/cdr
    '10505': { '1':'N-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10506': { '1':'N-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10507': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10508': { '1':'N-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10509': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10510': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10511': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    // client/fdr
    '10512': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    '10513': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    '10514': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10515': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    '10516': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10517': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    // client/rdr
    '10519': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    '10520': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10521': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    '10522': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10523': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10524': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    // comp
    '10221': { '1':'P','2':'P','3':'P','4':'P','8':'P' },
    '10222': { '1':'/','2':'/','3':'/','4':'/','8':'/' },
    '10120': { '1':'P','2':'P','3':'P','4':'P','8':'P' },
    // job
    '10228': { '1':'/','2':'P','3':'P','4':'P','8':'P' },
    '10223': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    '10224': { '1':'N','2':'P','3':'N-OST','4':'N','8':'/' },
    '10239': { '1':'P','2':'P','3':'P','4':'P','8':'/' },
    '10502': { '1':'P','2':'P','3':'P','4':'P','8':'/' },
    '10243': { '1':'P-OST','2':'/','3':'/','4':'N-OST','8':'/' },
    '10225': { '1':'PP','2':'P-OST','3':'/','4':'PP','8':'/' },
    '10226': { '1':'/','2':'/','3':'/','4':'/','8':'P' },
    '10227': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10249': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10255': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10407': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10258': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10526': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10527': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    '10528': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    '10529': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    '10234': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10248': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10235': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10238': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10534': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    // pens
    '10113': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10114': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10115': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10504': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    // insh
    '10102': { '1':'P','2':'/','3':'N','4':'N','8':'/' },
    // inso/insp
    '10103': { '1':'N-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10104': { '1':'N-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    // unemplcomp
    '10376': { '1':'N-OST','2':'N-OST','3':'/','4':'N-OST','8':'/' },
    '10525': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10377': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10378': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10379': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10380': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10381': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10530': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10531': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10532': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10533': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10386': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    '10387': { '1':'PP','2':'PP','3':'/','4':'PP','8':'/' },
    // fact
    '10090': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10091': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10085': { '1':'N','2':'/','3':'N','4':'N','8':'/' },
    '10086': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10087': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    // forinreg
    '10427': { '1':'P-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10428': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    // forin
    '10092': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10093': { '1':'N-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10094': { '1':'N-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10095': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10096': { '1':'N-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10097': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10098': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10099': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10100': { '1':'N-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    '10101': { '1':'N-OST','2':'/','3':'N-OST','4':'N-OST','8':'/' },
    // nocitizen
    '10414': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10105': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10106': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10107': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10108': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10109': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
    '10110': { '1':'PP','2':'/','3':'PP','4':'PP','8':'/' },
  },
  foreignKeywords: ['cizin', 'cizi', 'foreig', 'foreign', 'zahran', 'cuzi'],
  getRowLabel: function(fields) { return (fields['client/name/sur']?.value || '') + ' ' + (fields['client/name/fir']?.value || ''); },
  rowColumnLabel: 'Jméno',
  getRowInfo: [
    { key: 'client/bno', label: 'RČ' },
    { key: 'insh/cnr', label: 'ZP' },
    { key: 'client/stat/cnt', label: 'Občanství' },
    { key: 'job/relDetail', label: 'PPV' },
    { key: 'job/oid', label: 'ID PPV' }
  ],
  stats: {
    employer: 'comp/nam',
    date: 'employee/dat',
    citizenship: 'client/stat/cnt',
    action: 'employee/act',
    partialAccept: true
  },
  parseDocumentHeader: function(doc) {
    if (!doc) return [];
    const root = doc.documentElement;
    const fields = [];
    function attrField(label, key, el, attr) {
      const v = el.getAttribute(attr) || '';
      if (v) fields.push({ label, value: v, key, el, attr, _writeBack: 'attribute', modified: false });
    }
    attrField('Verze', 'root/version', root, 'version');
    attrField('Částečné přijetí', 'root/partialAccept', root, 'partialAccept');
    for (const c of root.children) {
      if (c.localName === 'VENDOR') {
        attrField('Software (název)', 'VENDOR/productName', c, 'productName');
        attrField('Software (verze)', 'VENDOR/productVersion', c, 'productVersion');
      } else if (c.localName === 'SENDER') {
        attrField('Verze protokolu', 'SENDER/VerzeProtokolu', c, 'VerzeProtokolu');
        attrField('E-mail notifikace', 'SENDER/EmailNotifikace', c, 'EmailNotifikace');
        attrField('ISDS report', 'SENDER/ISDSreport', c, 'ISDSreport');
        attrField('ISDS Report', 'SENDER/ISDSReport', c, 'ISDSReport');
      }
    }
    return fields;
  },
  resolveSection: function(empEl, sec) {
    if (sec.id === 'employee') return empEl;
    if (sec.child) { const p = getChildByLocalName(empEl, sec.element); return p ? getChildByLocalName(p, sec.child) : null; }
    return getChildByLocalName(empEl, sec.element);
  },
  ensureSectionPath: function(empEl, sec) {
    if (sec.id === 'employee') return empEl;
    const employeeChildOrder = ['client', 'comp', 'job', 'forin', 'pens', 'insh', 'inso', 'insp', 'unemplcomp', 'fact', 'nocitizen', 'forinreg', 'attachs'];
    const parts = sec.child ? [sec.element, sec.child] : [sec.element];
    let el = empEl;
    const ns = empEl.namespaceURI || empEl.ownerDocument.documentElement.namespaceURI || null;
    const prefix = empEl.prefix || empEl.ownerDocument.documentElement.prefix || '';
    function createLikeSource(doc, localName) {
      if (!ns) return doc.createElement(localName);
      return doc.createElementNS(ns, prefix ? prefix + ':' + localName : localName);
    }
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let child = getChildByLocalName(el, part);
      if (!child) {
        child = createLikeSource(el.ownerDocument, part);
        // Insert in schema order when adding direct children of employee
        if (el === empEl) {
          const idx = employeeChildOrder.indexOf(part);
          if (idx !== -1) {
            let insertBefore = null;
            for (const sibling of el.children) {
              const sibIdx = employeeChildOrder.indexOf(sibling.localName);
              if (sibIdx > idx) { insertBefore = sibling; break; }
            }
            el.insertBefore(child, insertBefore);
          } else {
            el.appendChild(child);
          }
        } else {
          el.appendChild(child);
        }
      }
      el = child;
    }
    return el;
  },
  resolveSectionInstances: function(empEl, sec) {
    if (!sec.repeating && !sec.parentRepeating) return null;
    const sectionId = sec.parentRepeating || sec.id;
    const parts = sectionId.split('/');
    const repeatElement = parts[parts.length - 1];
    let container = empEl;
    for (const part of parts.slice(0, -1)) {
      container = getChildByLocalName(container, part);
      if (!container) return [];
    }
    let instances = getAllChildrenByLocalNameNS(container, repeatElement, this.ns);
    if (instances.length === 0) instances = getAllChildrenByLocalNameNS(container, repeatElement, null);
    return instances.map((el, index) => ({ index, el, _orderValue: null }));
  },
  createRepeatingInstance: function(empEl, sec) {
    const sectionId = sec.parentRepeating || sec.id;
    const parts = sectionId.split('/');
    const repeatElement = parts[parts.length - 1];
    const employeeChildOrder = ['client', 'comp', 'job', 'forin', 'pens', 'insh', 'inso', 'insp', 'unemplcomp', 'fact', 'nocitizen', 'forinreg', 'attachs'];
    function insertChildInSchemaOrder(parent, child) {
      if (parent !== empEl) {
        parent.appendChild(child);
        return child;
      }
      const childIndex = employeeChildOrder.indexOf(child.localName);
      if (childIndex === -1) {
        parent.appendChild(child);
        return child;
      }
      let insertBefore = null;
      for (const sibling of parent.children) {
        const siblingIndex = employeeChildOrder.indexOf(sibling.localName);
        if (siblingIndex > childIndex) {
          insertBefore = sibling;
          break;
        }
      }
      parent.insertBefore(child, insertBefore);
      return child;
    }
    let container = empEl;
    for (const part of parts.slice(0, -1)) {
      let next = getChildByLocalName(container, part);
      if (!next) {
        next = this.ns ? container.ownerDocument.createElementNS(this.ns, part) : container.ownerDocument.createElement(part);
        insertChildInSchemaOrder(container, next);
      }
      container = next;
    }
    const newEl = this.ns ? container.ownerDocument.createElementNS(this.ns, repeatElement) : container.ownerDocument.createElement(repeatElement);
    container.appendChild(newEl);
    return newEl;
  },
  headerFields: ['sqnr', 'dep', 'act', 'dat', 'fro'],
  readField: function(targetEl, field) {
    if (!targetEl) return '';
    return targetEl.getAttribute(field.attr) || '';
  },
  writeField: function(fieldRef, value) {
    fieldRef.el.setAttribute(fieldRef.attr, value || '');
  },
  writeHeaderField: function(headerRef, value) {
    if (headerRef._writeBack === 'attribute') {
      if (value) headerRef.el.setAttribute(headerRef.attr, value);
      else headerRef.el.removeAttribute(headerRef.attr);
    } else {
      headerRef.el.textContent = value;
    }
  },
  fieldAttrKey: function(field) { return field.attr; },
  fieldXpath: function(field) { return field.section + '/@' + field.attr; },
  determineRowType: function(fields) {
    const rel = fields['job/rel']?.value || '';
    const relDetail = fields['job/relDetail']?.value || '';
    if (!rel) return 'OST';
    if (['11','12','13','14','M'].includes(rel)) return 'SPEC';
    if (rel === '10') return '10';
    if (/^[1-9]$/.test(rel) && relDetail === '2') return 'SPEC';
    return 'OST';
  },
  rowElementPattern: /<[a-zA-Z]*:?employee[\s>]/,
  fieldGroups: [
    { id: 'personal',    label: 'Osoba',           query: 'identifikace, jmeno a prijmeni, narozeni, pohlavi a obcanstvi' },
    { id: 'addresses',  label: 'Adresy',          query: 'trvale bydliste, kontaktni adresa, pobyt v cr, adresa rezidence' },
    { id: 'employer',   label: 'Zaměstnavatel',   query: 'zamestnavatel' },
    { id: 'employment', label: 'Pracovní poměr',  query: 'pracovni pomer, profese, pozice' },
    { id: 'insurance',  label: 'Pojišťovny',      query: 'zdravotni pojistovna, soucasny organ np mimo cssz, predchozi organ np mimo cssz' },
    { id: 'pension',    label: 'Důchod',          query: 'duchod' },
    { id: 'termination',label: 'Ukončení',        query: 'podpora v nezamestnanosti, duchodove pojisteni' },
    { id: 'health',     label: 'Zdraví',          query: 'dalsi udaje ztp, zdravotni omezeni' },
    { id: 'foreign',    label: 'Cizinec',         query: 'cizozemsky nositel pojisteni, cizi pravni predpisy, cizinec \u2013 pracovni opravneni, danova identifikace, doklad totoznosti' },
    { id: 'attachments',label: 'Prilohy',         query: 'přílohy' },
  ],
  sanitizerMeta: {
    optionalChildren: {
      'employee': ['forin','pens','insh','inso','insp','unemplcomp','fact','nocitizen','forinreg','attachs'],
      'REGZEC': ['VENDOR','SENDER'],
      'client': ['name','birth','stat','adr','fdr','cdr','rdr','taxidrezid','proofid'],
      'job': ['position','prof'],
      'unemplcomp': ['pensionperiod'],
      'fact': ['healtrest'],
      'attachs': ['attach']
    },
    optionalAttrs: {
      'REGZEC': ['version','partialAccept'],
      'employee': ['fro'],
      'client': ['bno','ikmpsv','vcp'],
      'name': ['sur','ona','fir','tit'],
      'birth': ['dat','nam','cit','stat'],
      'stat': ['mal','cnt'],
      'adr': ['str','onum','ruianpoint'],
      'fdr': ['str','onum','ruianpoint'],
      'cdr': ['str','onum','ruianpoint'],
      'rdr': ['str','onum'],
      'comp': ['nvs'],
      'job': ['oid','fro','to','rel','relDetail','sme','endbydeath','notstart','contractfro','relat','workmode','cont','place','preplace','contractplace','cit','municode'],
      'forin': ['cur','nam','str','num','onum','pnu','cit','id','sec'],
      'pens': ['typ','tak','early','reducedAge'],
      'unemplcomp': ['rsn','typeempl','belong','fullpay','avgmonear','rsnterrel','rsnterempl','replacement','goldenhandshake','severancepay','disposal','earlyterm'],
      'fact': ['ztp','highedu'],
      'nocitizen': ['freeacc','perm','permtype','issue','permid','permfro','permto'],
      'forinreg': ['juris','state'],
      'taxidrezid': ['type','num','stat','statchang'],
      'proofid': ['type','num','foreigninst','stat']
    }
  },
};

const PREZEC_CONFIG = {
  name: 'PREZEC',
  ns: 'http://schemas.cssz.cz/PREZEC/2026',
  rootElement: 'PREZEC',
  rowsContainer: 'employees',
  rowElement: 'employee',
  rowParentElement: null,
  fieldMode: 'attributes',
  hasActions: true,
  hasForeignerFilter: false,
  schemasKey: 'PREZEC_SCHEMAS',
  mainSchema: 'PREZEC26.xsd',
  sections: [
    { id: 'employee', label: 'Hlavička předregistrace', element: null },
    { id: 'client', label: 'Identifikace zaměstnance', element: 'client' },
    { id: 'client/name', label: 'Jméno a příjmení', element: 'client', child: 'name' },
    { id: 'client/birth', label: 'Narození', element: 'client', child: 'birth' },
    { id: 'client/stat', label: 'Občanství', element: 'client', child: 'stat' },
    { id: 'comp', label: 'Zaměstnavatel', element: 'comp' },
  ],
  fields: [
    { section: 'employee', attr: 'sqnr', csszId: null, ruleId: 'PREZEC_SQNR', label: 'Pořadové číslo věty', type: 'number' },
    { section: 'employee', attr: 'act', csszId: '10008', label: 'Číslo akce', type: 'number' },
    { section: 'employee', attr: 'idform', csszId: '10012', label: 'ID formuláře', type: 'text', maxLength: 36 },
    { section: 'employee', attr: 'dat', csszId: '10005', label: 'Datum vyplnění', type: 'date' },
    { section: 'employee', attr: 'predat', csszId: '10223', label: 'Předpokládané datum nástupu', type: 'date' },
    { section: 'client', attr: 'bno', csszId: '10057', label: 'Rodné číslo / EČP', type: 'text', maxLength: 10 },
    { section: 'client/name', attr: 'sur', csszId: '10053', label: 'Příjmení', type: 'text', maxLength: 50 },
    { section: 'client/name', attr: 'fir', csszId: '10054', label: 'Jméno', type: 'text', maxLength: 50 },
    { section: 'client/birth', attr: 'nam', csszId: '10063', label: 'Rodné příjmení', type: 'text', maxLength: 50 },
    { section: 'client/birth', attr: 'cit', csszId: '10066', label: 'Místo narození', type: 'text', maxLength: 50 },
    { section: 'client/stat', attr: 'cnt', csszId: '10067', label: 'Státní občanství', type: 'text', maxLength: 2 },
    { section: 'comp', attr: 'vs', csszId: '10221', label: 'Variabilní symbol zaměstnavatele', type: 'text', maxLength: 10 },
  ],
  actionLabels: { '1': 'P1 Předregistrace', '2': 'P2 Zaměstnanec nenastoupil' },
  actionSections: null,
  fieldRules: {
    'PREZEC_SQNR': { '1':'P','2':'P' },
    '10008': { '1':'P','2':'P' },
    '10012': { '1':'P','2':'P' },
    '10005': { '1':'P','2':'P' },
    '10057': { '1':'P','2':'P' },
    '10053': { '1':'P','2':'/' },
    '10054': { '1':'P','2':'/' },
    '10063': { '1':'P','2':'/' },
    '10066': { '1':'P','2':'/' },
    '10067': { '1':'P','2':'/' },
    '10221': { '1':'P','2':'P' },
    '10223': { '1':'P','2':'/' },
  },
  actionFilterMeta: {
    rowField: 'employee/act',
    visibleFields: {
      '1': null,
      '2': ['employee/sqnr', 'employee/act', 'employee/idform', 'employee/dat', 'client/bno', 'comp/vs'],
    },
  },
  foreignKeywords: null,
  getRowLabel: function(fields) {
    const fullName = ((fields['client/name/sur']?.value || '') + ' ' + (fields['client/name/fir']?.value || '')).trim();
    return fullName || fields['client/bno']?.value || fields['employee/idform']?.value || fields['employee/sqnr']?.value || '';
  },
  rowColumnLabel: 'Zaměstnanec',
  getRowInfo: [
    { key: 'client/bno', label: 'RČ' },
    { key: 'comp/vs', label: 'VS' },
    { key: 'employee/idform', label: 'ID formuláře' },
    { key: 'employee/predat', label: 'Nástup' },
    { key: 'client/stat/cnt', label: 'Občanství' },
  ],
  stats: {
    employer: 'comp/vs',
    date: 'employee/dat',
    citizenship: 'client/stat/cnt',
    action: 'employee/act',
    partialAccept: true
  },
  parseDocumentHeader: function(doc) {
    if (!doc) return [];
    const root = doc.documentElement;
    const fields = [];
    function attrField(label, key, el, attr) {
      const v = el.getAttribute(attr) || '';
      if (v) fields.push({ label, value: v, key, el, attr, _writeBack: 'attribute', modified: false });
    }
    attrField('Verze', 'root/version', root, 'version');
    attrField('Částečné přijetí', 'root/partialAccept', root, 'partialAccept');
    for (const c of root.children) {
      if (c.localName === 'VENDOR') {
        attrField('Software (název)', 'VENDOR/productName', c, 'productName');
        attrField('Software (verze)', 'VENDOR/productVersion', c, 'productVersion');
      } else if (c.localName === 'SENDER') {
        attrField('Verze protokolu', 'SENDER/VerzeProtokolu', c, 'VerzeProtokolu');
        attrField('E-mail notifikace', 'SENDER/EmailNotifikace', c, 'EmailNotifikace');
        attrField('ISDS report', 'SENDER/ISDSreport', c, 'ISDSreport');
      }
    }
    return fields;
  },
  resolveSection: function(empEl, sec) {
    if (sec.id === 'employee') return empEl;
    if (sec.child) { const p = getChildByLocalName(empEl, sec.element); return p ? getChildByLocalName(p, sec.child) : null; }
    return getChildByLocalName(empEl, sec.element);
  },
  ensureSectionPath: function(empEl, sec) {
    if (sec.id === 'employee') return empEl;
    const employeeChildOrder = ['client', 'comp'];
    const clientChildOrder = ['name', 'birth', 'stat'];
    const parts = sec.child ? [sec.element, sec.child] : [sec.element];
    let el = empEl;
    const ns = empEl.namespaceURI || empEl.ownerDocument.documentElement.namespaceURI || null;
    const prefix = empEl.prefix || empEl.ownerDocument.documentElement.prefix || '';
    function createLikeSource(doc, localName) {
      if (!ns) return doc.createElement(localName);
      return doc.createElementNS(ns, prefix ? prefix + ':' + localName : localName);
    }
    function insertByOrder(parent, child, order) {
      const idx = order.indexOf(child.localName);
      if (idx === -1) {
        parent.appendChild(child);
        return;
      }
      let insertBefore = null;
      for (const sibling of parent.children) {
        const sibIdx = order.indexOf(sibling.localName);
        if (sibIdx > idx) { insertBefore = sibling; break; }
      }
      parent.insertBefore(child, insertBefore);
    }
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let child = getChildByLocalName(el, part);
      if (!child) {
        child = createLikeSource(el.ownerDocument, part);
        if (el === empEl) insertByOrder(el, child, employeeChildOrder);
        else if (el.localName === 'client') insertByOrder(el, child, clientChildOrder);
        else el.appendChild(child);
      }
      el = child;
    }
    return el;
  },
  resolveSectionInstances: function() { return null; },
  createRepeatingInstance: function() { return null; },
  headerFields: ['sqnr', 'act', 'idform', 'dat', 'predat'],
  readField: function(targetEl, field) {
    if (!targetEl) return '';
    return targetEl.getAttribute(field.attr) || '';
  },
  writeField: function(fieldRef, value) {
    fieldRef.el.setAttribute(fieldRef.attr, value || '');
  },
  writeHeaderField: function(headerRef, value) {
    if (headerRef._writeBack === 'attribute') {
      if (value) headerRef.el.setAttribute(headerRef.attr, value);
      else headerRef.el.removeAttribute(headerRef.attr);
    } else {
      headerRef.el.textContent = value;
    }
  },
  fieldAttrKey: function(field) { return field.attr; },
  fieldXpath: function(field) { return field.section + '/@' + field.attr; },
  determineRowType: function() { return null; },
  rowElementPattern: /<[a-zA-Z]*:?employee[\s>]/,
  fieldGroups: [
    { id: 'personal', label: 'Osoba', query: 'identifikace zamestnance, jmeno a prijmeni, narozeni, obcanstvi' },
  ],
  sanitizerMeta: {
    optionalChildren: {
      'PREZEC': ['VENDOR','SENDER'],
      'client': ['name','birth','stat'],
    },
    optionalAttrs: {
      'PREZEC': ['version','partialAccept'],
      'employee': ['idform','predat'],
      'name': ['sur','fir'],
      'birth': ['nam','cit'],
      'stat': ['cnt'],
    }
  },
};

const JMHZ_SECTION_DENY_BY_VARIANT = {
  bezPriznaku: ['teoretickaPraktickaPriprava'],
  cinnostKS: [
    'souhrnDataZec/mzdaCista',
    'souhrnDataZec/zdravPojZamestnavatel',
    'pojisteni/vymerovaciZakladParagraf5',
    'pojisteni/slevaZamestnavatele',
    'prubehZamestnani',
    'mzda',
    'teoretickaPraktickaPriprava',
  ],
  odlozenyPrijem: [
    'pojisteni/trvani',
    'pojisteni/eldpSeznam',
    'vykonavanaPozice',
    'prubehZamestnani',
    'mzda',
    'teoretickaPraktickaPriprava',
  ],
  pestoun: [
    'souhrnDataZec/prijmy/prispevekZamestnavatele',
    'souhrnDataZec/mzdaCista',
    'pojisteni/vymerovaciZakladParagraf5',
    'pojisteni/slevaZamestnavatele',
    'vykonavanaPozice',
    'prubehZamestnani',
    'mzda',
    'teoretickaPraktickaPriprava',
  ],
  vezen: [
    'souhrnDataZec/prijmy/prispevekZamestnavatele',
    'souhrnDataZec/mzdaCista/vydelekOZP',
    'souhrnDataZec/mzdaCista/srazky',
    'souhrnDataZec/zdravPojZamestnavatel',
    'souhrnDataZec/zdravPojZamestnanec',
    'pojisteni/vymerovaciZaklad',
    'pojisteni/vymerovaciZakladParagraf5',
    'pojisteni/pojisteniZamestnanec',
    'pojisteni/pojisteniZamestnavatel',
    'pojisteni/slevaZamestnavatele',
    'vykonavanaPozice',
    'prubehZamestnani/odpracovaneDny',
    'prubehZamestnani/neodpracovaneHodiny',
    'prubehZamestnani/prekazkyVPraci',
    'mzda/mzdaRozpad',
    'mzda/odmeny',
    'mzda/vydelek',
    'teoretickaPraktickaPriprava',
  ],
  mezinarodniPronajemSily: [
    'souhrnDataZec/prijmy/prispevekZamestnavatele',
    'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic',
    'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera',
    'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti',
    'souhrnDataZec/mzdaCista',
    'souhrnDataZec/zdravPojZamestnavatel',
    'souhrnDataZec/zdravPojZamestnanec',
    'pojisteni',
    'vykonavanaPozice',
    'prubehZamestnani',
    'mzda',
    'teoretickaPraktickaPriprava',
  ],
  jinyPrijem: [
    'souhrnDataZec/prijmy/prispevekZamestnavatele',
    'souhrnDataZec/mzdaCista',
    'souhrnDataZec/zdravPojZamestnavatel',
    'souhrnDataZec/zdravPojZamestnanec',
    'pojisteni',
    'vykonavanaPozice',
    'prubehZamestnani',
    'mzda',
    'teoretickaPraktickaPriprava',
  ],
  ozpTpp: ['souhrnDataZec', 'pojisteni', 'vykonavanaPozice', 'prubehZamestnani', 'prijem', 'mzda'],
};

const JMHZ_FIELD_DENY_BY_VARIANT = {
  mezinarodniPronajemSily: [
    'souhrnDataZec/prijmy/osvobozenoCelkem',
    'souhrnDataZec/prijmy/odmenyNerezident',
    'souhrnDataZec/prijmy/prispevekZamestnavatele',
    'souhrnDataZec/zalohaNaDan/danBonus',
    'souhrnDataZec/prohlaseniPoplatnikaDane/zakladniSlevaInvalidita12',
    'souhrnDataZec/prohlaseniPoplatnikaDane/rozsirenaSlevaInvalidita3',
    'souhrnDataZec/prohlaseniPoplatnikaDane/slevaZTPP',
    'souhrnDataZec/prohlaseniPoplatnikaDane/danoveZvyhodneniDetiMesic',
    'souhrnDataZec/prohlaseniPoplatnikaDane/slevaDite',
    'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic',
    'souhrnDataZec/rocniUhrny/prijemZdanitelnyDoplatek',
    'souhrnDataZec/rocniUhrny/zalohaDoplatky',
    'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/danPreplatekRok',
    'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/danBonusPreplatekRok',
    'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/uplatnenaSlevaNaPartnera',
    'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/uplatnenoZvyhodneniNaDeti',
    'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera',
    'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti',
  ],
  jinyPrijem: [
    'souhrnDataZec/prijmy/odmenyNerezident',
    'souhrnDataZec/prijmy/prispevekZamestnavatele',
  ],
};

function sectionMatchesPrefix(sectionId, prefix) {
  return sectionId === prefix || sectionId.indexOf(prefix + '/') === 0;
}

function getJmhzSectionId(sec) {
  return sec && (sec._resolvePath || sec.parentRepeating || sec.id);
}

function isJmhzSectionAllowed(formRoot, sec) {
  if (!sec) return false;
  if (sec._resolveFromRow) return true;
  if (!formRoot) return false;
  const variant = formRoot.localName;
  const sectionId = getJmhzSectionId(sec);
  if (!sectionId || sectionId === 'hlavicka') return true;
  const denied = JMHZ_SECTION_DENY_BY_VARIANT[variant] || [];
  return !denied.some(prefix => sectionMatchesPrefix(sectionId, prefix));
}

function getJmhzFormRootFromElement(el) {
  let node = el;
  while (node && node.nodeType === 1) {
    if (JMHZ_CONFIG.formVariants.indexOf(node.localName) !== -1) return node;
    node = node.parentNode;
  }
  return null;
}

function getJmhzFieldPath(field) {
  if (!field) return '';
  const elName = field.element || field.attr;
  return field.section && elName ? field.section + '/' + elName : '';
}

function isJmhzFieldAllowed(sectionEl, field) {
  const formRoot = getJmhzFormRootFromElement(sectionEl);
  if (!formRoot) return true;
  const fieldPath = getJmhzFieldPath(field);
  if (!fieldPath) return true;
  const denied = JMHZ_FIELD_DENY_BY_VARIANT[formRoot.localName] || [];
  return !denied.some(prefix => sectionMatchesPrefix(fieldPath, prefix));
}

const JMHZ_EXPLICIT_CHILD_ORDER = {
  'bezPriznaku': ['identifikace', 'souhrnDataZec', 'pojisteni', 'vykonavanaPozice', 'prubehZamestnani', 'prijem', 'mzda'],
  'cinnostKS': ['identifikace', 'souhrnDataZec', 'pojisteni', 'vykonavanaPozice', 'prijem'],
  'odlozenyPrijem': ['typ', 'identifikace', 'souhrnDataZec', 'pojisteni', 'prijem'],
  'pestoun': ['identifikace', 'souhrnDataZec', 'pojisteni', 'prijem'],
  'vezen': ['identifikace', 'souhrnDataZec', 'pojisteni', 'prubehZamestnani', 'prijem', 'mzda'],
  'mezinarodniPronajemSily': ['identifikace', 'souhrnDataZec', 'prijem'],
  'jinyPrijem': ['identifikace', 'souhrnDataZec', 'prijem'],
  'ozpTpp': ['identifikace', 'teoretickaPraktickaPriprava'],
  'souhrnDataZec': [
    'prijmy',
    'zalohaNaDan',
    'zvlastniSazbaDane',
    'prohlaseniPoplatnika',
    'prohlaseniPoplatnikaDane',
    'rocniUhrny',
    'mzdaCista',
    'zdravPojZamestnavatel',
    'zdravPojZamestnanec',
  ],
  'souhrnDataZec/prijmy': ['zuctovanoCelkem', 'osvobozenoCelkem', 'odmenyNerezident', 'prispevekZamestnavatele'],
  'souhrnDataZec/zalohaNaDan': ['zakladDane', 'vypoctenaZaloha', 'danZalohaPoSleve', 'danBonus'],
  'souhrnDataZec/zvlastniSazbaDane': ['zakladDane', 'srazenaDan', 'odmenaNerezident', 'srazenaDanNerezident'],
  'souhrnDataZec/prohlaseniPoplatnikaDane': ['zakladniSleva', 'zakladniSlevaInvalidita12', 'rozsirenaSlevaInvalidita3', 'slevaZTPP', 'danoveZvyhodneniDetiMesic', 'slevaDite', 'zvyhodneniDetiMesic'],
  'souhrnDataZec/rocniUhrny': ['prijemSrazkDanZvlSazba', 'danSrazenaZvlSazba', 'prijemZdanitelnyCelkem', 'prijemZdanitelnyDoplatek', 'zalohaPrijmy', 'zalohaDoplatky', 'rocniZuctovaniZadost', 'rocniZuctovaniProvedeno', 'vysledekRocnihoZuctovani'],
  'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani': ['preplatekRok', 'danPreplatekRok', 'danBonusPreplatekRok', 'uplatnenaSlevaNaPartnera', 'uplatnenoZvyhodneniNaDeti', 'slevaNaPartnera', 'zvyhodneniNaDeti'],
  'souhrnDataZec/mzdaCista': ['mzdaCista', 'srazkyZeMzdyEvidovany', 'vydelekOZP', 'srazky'],
  'pojisteni': ['trvani', 'vymerovaciZaklad', 'vymerovaciZakladParagraf5', 'eldpObdobi', 'eldpSeznam', 'pojisteniZamestnanec', 'pojisteniZamestnavatel', 'slevaZamestnance', 'slevaZamestnavatele'],
  'pojisteni/trvani': ['pojisteniOd', 'pojisteniDo'],
  'pojisteni/eldpSeznam/eldp': ['kod', 'platnostOd', 'platnostDo', 'pocetDnu', 'vylouceneDny', 'odecitaneDny', 'vymerovaciZaklad'],
  'vykonavanaPozice': ['mistoVykonuPrace', 'uplatnujiPrispevekApz', 'funkcniPozitky', 'docasnePrideleniEvidovano', 'docasnePrideleni', 'nastrojApzKod', 'fondPracovniDoby'],
  'vykonavanaPozice/mistoVykonuPrace': ['obec', 'kodObce', 'kodStatu'],
  'vykonavanaPozice/fondPracovniDoby': ['stanovenyFond', 'sjednanyFond', 'stanovenaTydenniDoba'],
  'prubehZamestnani': ['odpracovaneDny', 'odpracovaneHodiny', 'neodpracovaneHodiny', 'prekazkyVPraci'],
  'prubehZamestnani/odpracovaneDny': ['dnyEvidencniStav', 'dnyOdpracovanePocet'],
  'prubehZamestnani/odpracovaneHodiny': ['pocet', 'rozpad'],
  'mzda': ['mzdaZuctovana', 'mzdaRozpad', 'nahrady', 'odmeny', 'vydelek'],
  'mzda/mzdaRozpad': ['tarif', 'odmenyPravidelne', 'odmenyNepravidelne', 'priplatky'],
  'mzda/nahrady': ['mzdyZuctovane', 'docasnaNeschopnost', 'dovolena', 'prekazkyZamestnanec', 'prekazkyZamestnavatel', 'svatky'],
};

function addJmhzOrderPath(order, path) {
  const parts = path.split('/').filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const parentKey = parts.slice(0, i).join('/');
    const childName = parts[i];
    if (!order[parentKey]) order[parentKey] = [];
    if (order[parentKey].indexOf(childName) === -1) order[parentKey].push(childName);
  }
}

function buildJmhzChildOrder(config) {
  const order = {};
  for (const s of config.sections || []) {
    addJmhzOrderPath(order, s._resolvePath || s.id);
  }
  for (const f of config.fields || []) {
    const elName = f.element || f.attr;
    if (!f.section || !elName) continue;
    addJmhzOrderPath(order, f.section + '/' + elName);
  }
  for (const key in JMHZ_EXPLICIT_CHILD_ORDER) {
    order[key] = JMHZ_EXPLICIT_CHILD_ORDER[key].slice();
  }
  return order;
}

function findSchemaOrderRef(parent, child, order) {
  if (!order) return null;
  const idx = order.indexOf(child.localName);
  if (idx === -1) return null;
  for (const sib of parent.children) {
    const si = order.indexOf(sib.localName);
    if (si > idx) return sib;
  }
  return null;
}

function insertInSchemaOrder(parent, child, order) {
  const ref = findSchemaOrderRef(parent, child, order);
  parent.insertBefore(child, ref);
}

const JMHZ_CONFIG = {
  name: 'Měsíční hlášení',
  ns: 'http://schemas.cssz.cz/JMHZ/podani/1.0',
  formNs: 'http://schemas.cssz.cz/JMHZ/form/1.0',
  rootElement: 'jmhz',
  rowsContainer: null,
  rowElement: 'formularOsoby',
  rowParentElement: 'formulareOsob',
  fieldMode: 'elements',
  hasActions: false,
  hasForeignerFilter: false,
  schemasKey: 'JMHZ_SCHEMAS',
  mainSchema: 'jmhzPodani.xsd',
  sections: [
    { id: 'hlavickaFormulare', label: 'Hlavička formuláře', _resolvePath: 'hlavicka', _resolveFromRow: true },
    { id: 'typOdlozenehoPrijmu', label: 'Typ odloženého příjmu', _resolveSelf: true },
    { id: 'identifikace', label: 'Identifikace zaměstnance' },
    { id: 'souhrnDataZec', label: 'Souhrnná data ZEC' },
    { id: 'souhrnDataZec/prijmy', label: 'Příjmy' },
    { id: 'souhrnDataZec/prijmy/prispevekZamestnavatele', label: 'Příspěvek zaměstnavatele (z osvobozených příjmů)' },
    { id: 'souhrnDataZec/zalohaNaDan', label: 'Výpočet zálohy na daň' },
    { id: 'souhrnDataZec/zvlastniSazbaDane', label: 'Výpočet daně podle zvláštní sazby daně' },
    { id: 'souhrnDataZec/prohlaseniPoplatnikaDane', label: 'Prohlášení poplatníka daně' },
    { id: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic', label: 'Daňové zvýhodnění na děti (měsíc)' },
    { id: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/jineOsoby/jinaOsoba', label: 'Jiná osoba vyživující děti', repeating: true },
    { id: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite', label: 'Vyživované dítě (měsíc)', repeating: true, orderElement: 'poradi' },
    { id: 'prispevekZamestnavateleOstatni', label: 'Příspěvek zaměstnavatele (z osvobozených příjmů)', _resolvePath: 'souhrnDataZec/prijmy/prispevekZamestnavatele' },
    { id: 'souhrnDataZec/rocniUhrny', label: 'Roční úhrny jednotlivých položek' },
    { id: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani', label: 'Výsledek ročního zúčtování' },
    { id: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', label: 'Sleva na manželku / manžela' },
    { id: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti', label: 'Daňové zvýhodnění na děti (roční)' },
    { id: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/jineOsoby/jinaOsoba', label: 'Jiná osoba (roční zúčtování)', repeating: true },
    { id: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite', label: 'Vyživované dítě (roční zúčtování)', repeating: true, orderElement: 'poradi' },
    { id: 'souhrnDataZec/mzdaCista', label: 'Čistá mzda' },
    { id: 'souhrnDataZec/mzdaCista/vydelekOZP', label: 'Výdělek osob OZP' },
    { id: 'souhrnDataZec/mzdaCista/srazky', label: 'Srážky ze mzdy' },
    { id: 'souhrnDataZec/zdravPojZamestnavatel', label: 'Zdravotní pojištění za zaměstnavatele' },
    { id: 'souhrnDataZec/zdravPojZamestnanec', label: 'Zdravotní pojištění za zaměstnance' },
    { id: 'pojisteni', label: 'Průběh pojištění' },
    { id: 'pojisteni/trvani', label: 'Trvání pojištění' },
    { id: 'pojisteni/vymerovaciZaklad', label: 'Vyměřovací základ' },
    { id: 'pojisteni/vymerovaciZakladParagraf5', label: 'Vyměřovací základ § 5a' },
    { id: 'pojisteni/eldpObdobi/obdobi', label: 'ELDP - Období', repeating: true },
    { id: 'pojisteni/eldpSeznam/eldp', label: 'ELDP', repeating: true },
    { id: 'pojisteni/eldpSeznam/eldp/vylouceneDny', label: 'ELDP - Vyloučené dny', parentRepeating: 'pojisteni/eldpSeznam/eldp' },
    { id: 'pojisteni/eldpSeznam/eldp/odecitaneDny', label: 'ELDP - Odečítané dny', parentRepeating: 'pojisteni/eldpSeznam/eldp' },
    { id: 'pojisteni/pojisteniZamestnanec', label: 'Pojistné za zaměstnance' },
    { id: 'pojisteni/pojisteniZamestnavatel', label: 'Pojistné za zaměstnavatele' },
    { id: 'pojisteni/slevaZamestnance', label: 'Sleva na pojistném zaměstnanců' },
    { id: 'pojisteni/slevaZamestnavatele', label: 'Sleva na pojistném zaměstnavatele' },
    { id: 'pojisteni/slevaZamestnavatele/slevaZamestnavateleRozpad', label: 'Sleva na pojistném zaměstnavatele - rozpad' },
    { id: 'vykonavanaPozice', label: 'Vykonávaná pozice' },
    { id: 'vykonavanaPozice/mistoVykonuPrace', label: 'Místo výkonu práce' },
    { id: 'vykonavanaPozice/docasnePrideleni/uzivatel', label: 'Dočasné přidělení - uživatel' },
    { id: 'vykonavanaPozice/fondPracovniDoby', label: 'Fond pracovní doby' },
    { id: 'prubehZamestnani', label: 'Průběh zaměstnání' },
    { id: 'prubehZamestnani/odpracovaneDny', label: 'Odpracované dny' },
    { id: 'prubehZamestnani/odpracovaneHodiny', label: 'Odpracované hodiny' },
    { id: 'prubehZamestnani/odpracovaneHodiny/rozpad', label: 'Odpracované hodiny - rozpad' },
    { id: 'prubehZamestnani/odpracovaneHodiny/rozpad/hornictvi', label: 'Hlubinné hornictví' },
    { id: 'prubehZamestnani/odpracovaneHodiny/rozpad/riziko', label: 'Riziková práce' },
    { id: 'prubehZamestnani/neodpracovaneHodiny', label: 'Neodpracované hodiny' },
    { id: 'prubehZamestnani/prekazkyVPraci', label: 'Překážky v práci' },
    { id: 'prijem', label: 'Příjem v daném měsíci' },
    { id: 'prijem/dan', label: 'Daň' },
    { id: 'prijem/specifickaSkutecnost', label: 'Specifická právní skutečnost' },
    { id: 'teoretickaPraktickaPriprava/obdobi', label: 'Průběh teoretické a praktické přípravy', repeating: true },
    { id: 'mzda', label: 'Mzda' },
    { id: 'mzda/mzdaRozpad', label: 'Mzda - rozpad' },
    { id: 'mzda/mzdaRozpad/priplatky', label: 'Příplatky' },
    { id: 'mzda/nahrady', label: 'Náhrady' },
    { id: 'mzda/odmeny', label: 'Odměny' },
    { id: 'mzda/vydelek', label: 'Výdělek' },
  ],
  fieldGroups: [
    { id: 'identification', label: 'Identifikace',     query: 'identifikace zamestnance' },
    { id: 'work',           label: 'Práce a pozice',   query: 'vykonavana pozice, prubeh zamestnani, prijem v danem mesici' },
    { id: 'insurance',      label: 'Pojištění a ELDP', query: 'trvani pojisteni, vymero, eldp' },
    { id: 'contributions',  label: 'Pojistné',         query: 'pojistne za zamestnance, pojistne za zamestnavatele, sleva na pojistnem zamestnancu, sleva na pojistnem zamestnavatele, zdravotni' },
    { id: 'income',         label: 'Příjmy',           query: 'prijmy, cista mzda, zdravotni pojisteni za zamestnavatele, zdravotni pojisteni za zamestnance' },
    { id: 'tax',            label: 'Daně',             query: 'zaloha na dan, zvlastni sazba, prohlaseni poplatnika' },
    { id: 'wages',          label: 'Mzda',             query: 'mzda' },
    { id: 'annual',         label: 'Roční zúčtování',  query: 'rocni uhrny jednotlivych polozek' },
    { id: 'children',       label: 'Děti',             query: 'zvyhodneni deti, jina osoba, vyzivovane dite' },
  ],
  parseDocumentHeader: function(doc) {
    if (!doc) return [];
    function findEl(parent, localName) {
      if (!parent) return null;
      for (const c of parent.children) if (c.localName === localName) return c;
      return null;
    }
    function textField(label, key, parent, localName) {
      const e = findEl(parent, localName);
      if (!e) return null;
      const v = e.textContent.trim();
      if (!v) return null;
      return { label, value: v, key, el: e, attr: null, _writeBack: 'textContent', modified: false };
    }
    function attrField(label, key, el, attr) {
      const v = el.getAttribute(attr) || '';
      if (!v) return null;
      return { label, value: v, key, el, attr, _writeBack: 'attribute', modified: false };
    }
    function push(f) { if (f) fields.push(f); }
    const root = doc.documentElement;
    const hlavicka = findEl(root, 'hlavicka');
    const vendor   = findEl(root, 'VENDOR');
    const sender   = findEl(root, 'SENDER');
    const fields = [];
    if (hlavicka) {
      push(textField('Měsíc', 'hlavicka/mesic', hlavicka, 'mesic'));
      push(textField('Rok', 'hlavicka/rok', hlavicka, 'rok'));
      push(textField('Typ podání', 'hlavicka/typPodani', hlavicka, 'typPodani'));
      push(textField('Variabilní symbol', 'hlavicka/variabilniSymbol', hlavicka, 'variabilniSymbol'));
      const datF = textField('Datum vyplnění', 'hlavicka/datumVyplneni', hlavicka, 'datumVyplneni');
      if (datF) { datF.value = datF.value.replace('T', ' ').replace('Z', ''); push(datF); }
      push(textField('ID podání', 'hlavicka/idPodani', hlavicka, 'idPodani'));
      push(textField('Balík pořadí', 'hlavicka/balikPoradi', hlavicka, 'balikPoradi'));
      push(textField('Balíky počet', 'hlavicka/balikyPocet', hlavicka, 'balikyPocet'));
      push(textField('Formulářů v balíku', 'hlavicka/formularePocetVBaliku', hlavicka, 'formularePocetVBaliku'));
      push(textField('Formulářů celkem', 'hlavicka/formularePocetCelkem', hlavicka, 'formularePocetCelkem'));
    }
    if (vendor) {
      push(attrField('Software (název)', 'VENDOR/productName', vendor, 'productName'));
      push(attrField('Software (verze)', 'VENDOR/productVersion', vendor, 'productVersion'));
    }
    if (sender) {
      push(attrField('Verze protokolu', 'SENDER/VerzeProtokolu', sender, 'VerzeProtokolu'));
      push(attrField('E-mail notifikace', 'SENDER/EmailNotifikace', sender, 'EmailNotifikace'));
      push(attrField('ISDS report', 'SENDER/ISDSreport', sender, 'ISDSreport'));
    }
    const souhrn = findEl(root, 'souhrn');
    if (souhrn) {
      const mesic = findEl(souhrn, 'danUdajeMesic');
      if (mesic) {
        push(textField('Záloha na daň (měsíc)', 'souhrn/danUdajeMesic/danZalohaPoSleve', mesic, 'danZalohaPoSleve'));
        push(textField('Daňový bonus (měsíc)', 'souhrn/danUdajeMesic/danBonus', mesic, 'danBonus'));
      }
      const rok = findEl(souhrn, 'danUdajeRok');
      if (rok) {
        push(textField('Přeplatek na dani (rok)', 'souhrn/danUdajeRok/danPreplatek', rok, 'danPreplatek'));
        push(textField('Doplatek daňového bonusu (rok)', 'souhrn/danUdajeRok/danBonusDoplatek', rok, 'danBonusDoplatek'));
      }
    }
    const pvpoj = findEl(root, 'PVPOJ');
    if (pvpoj) {
      const poj = findEl(pvpoj, 'pojistne');
      if (poj) {
        push(textField('Základ poj. zaměstnavatele A', 'PVPOJ/pojistne/zakladZamestnavateleA', poj, 'zakladZamestnavateleA'));
        push(textField('Pojistné zaměstnavatele A', 'PVPOJ/pojistne/pojistneZamestnavateleA', poj, 'pojistneZamestnavateleA'));
        push(textField('Základ poj. zaměstnavatele B', 'PVPOJ/pojistne/zakladZamestnavateleB', poj, 'zakladZamestnavateleB'));
        push(textField('Pojistné zaměstnavatele B', 'PVPOJ/pojistne/pojistneZamestnavateleB', poj, 'pojistneZamestnavateleB'));
        push(textField('Základ poj. zaměstnavatele C', 'PVPOJ/pojistne/zakladZamestnavateleC', poj, 'zakladZamestnavateleC'));
        push(textField('Pojistné zaměstnavatele C', 'PVPOJ/pojistne/pojistneZamestnavateleC', poj, 'pojistneZamestnavateleC'));
        push(textField('Pojistné zaměstnavatele celkem', 'PVPOJ/pojistne/pojistneZamestnavateleCelkem', poj, 'pojistneZamestnavateleCelkem'));
        push(textField('Pojistné zaměstnance', 'PVPOJ/pojistne/pojistneZamestnance', poj, 'pojistneZamestnance'));
        push(textField('Pojistné celkem', 'PVPOJ/pojistne/pojistneCelkem', poj, 'pojistneCelkem'));
      }
      const szl = findEl(pvpoj, 'slevaZamestnavatele');
      if (szl) {
        push(textField('Sleva zaměstnavatele — Počet zaměstnanců', 'PVPOJ/slevaZamestnavatele/pocetZamestnancu', szl, 'pocetZamestnancu'));
        push(textField('Sleva zaměstnavatele — Úhrn vyměř. základů', 'PVPOJ/slevaZamestnavatele/uhrnVymerovacichZakladu', szl, 'uhrnVymerovacichZakladu'));
        push(textField('Sleva zaměstnavatele — Pojistné (sleva)', 'PVPOJ/slevaZamestnavatele/pojistneSleva', szl, 'pojistneSleva'));
      }
      const szc = findEl(pvpoj, 'slevyZamestnancu');
      if (szc) {
        push(textField('Slevy zaměstnanců — Počet zaměstnanců', 'PVPOJ/slevyZamestnancu/pocetZamestnancu', szc, 'pocetZamestnancu'));
        push(textField('Slevy zaměstnanců — Úhrn vyměř. základů', 'PVPOJ/slevyZamestnancu/uhrnVymerovacichZakladu', szc, 'uhrnVymerovacichZakladu'));
        push(textField('Slevy zaměstnanců — Pojistné (sleva)', 'PVPOJ/slevyZamestnancu/pojistneSleva', szc, 'pojistneSleva'));
      }
      const szo = findEl(pvpoj, 'slevyZamestnancuOvoZel');
      if (szo) {
        push(textField('Slevy zaměstnanců ovo/zel — Počet zaměstnanců', 'PVPOJ/slevyZamestnancuOvoZel/pocetZamestnancu', szo, 'pocetZamestnancu'));
        push(textField('Slevy zaměstnanců ovo/zel — Úhrn vyměř. základů', 'PVPOJ/slevyZamestnancuOvoZel/uhrnVymerovacichZakladu', szo, 'uhrnVymerovacichZakladu'));
        push(textField('Slevy zaměstnanců ovo/zel — Pojistné (sleva)', 'PVPOJ/slevyZamestnancuOvoZel/pojistneSleva', szo, 'pojistneSleva'));
      }
      push(textField('Pojistné k úhradě', 'PVPOJ/pojistneUhrada', pvpoj, 'pojistneUhrada'));
    }
    return fields;
  },
  fields: [
   { section: 'hlavickaFormulare', element: 'idFormulare', csszId: '10012', label: 'ID formuláře', type: 'text' },
   { section: 'hlavickaFormulare', element: 'typFormulare', csszId: '10016', label: 'Typ formuláře', type: 'text' },
   { section: 'hlavickaFormulare', element: 'primarniPpv', csszId: '10495', label: 'Primární pracovněprávní vztah', type: 'boolean' },

    { section: 'typOdlozenehoPrijmu', element: 'typ', csszId: '10548', label: 'Typ odloženého příjmu', type: 'text' },

    { section: 'identifikace', element: 'ikMpsv', csszId: '10051', label: 'IK MPSV', type: 'text' },
    { section: 'identifikace', element: 'idPpv', csszId: '10228', label: 'ID pracovněprávního vztahu', type: 'text' },
    { section: 'identifikace', element: 'prijmeni', csszId: '10053', label: 'Příjmení zaměstnance', type: 'text' },
    { section: 'identifikace', element: 'jmeno', csszId: '10054', label: 'Jméno zaměstnance', type: 'text' },
    { section: 'identifikace', element: 'datumNarozeni', csszId: '10056', label: 'Datum narození', type: 'date' },
    { section: 'identifikace', element: 'datumNastupu', csszId: '10223', label: 'Datum nástupu do zaměstnání', type: 'date' },
    { section: 'identifikace', element: 'druhCinnosti', csszId: '10239', label: 'Druh činnosti', type: 'text' },

    { section: 'souhrnDataZec/prijmy', element: 'zuctovanoCelkem', csszId: '10286', label: 'Zúčtovaný příjem celkem', type: 'number' },
    { section: 'souhrnDataZec/prijmy', element: 'osvobozenoCelkem', csszId: '10289', label: 'Osvobozené příjmy celkem', type: 'number' },
    { section: 'souhrnDataZec/prijmy', element: 'odmenyNerezident', csszId: '10416', label: 'Odměny nerezidentů (členů orgánů PO)', type: 'number' },

    { section: 'souhrnDataZec/prijmy/prispevekZamestnavatele', element: 'prispevekZelSporeniOsvob', csszId: '10417', label: 'Příspěvek na spoření na stáří (osvobozený)', type: 'number' },

    { section: 'souhrnDataZec/zalohaNaDan', element: 'zakladDane', csszId: '10297', label: 'Základ pro výpočet zálohy na daň', type: 'number' },
    { section: 'souhrnDataZec/zalohaNaDan', element: 'vypoctenaZaloha', csszId: '10298', label: 'Vypočtená záloha na daň', type: 'number' },
    { section: 'souhrnDataZec/zalohaNaDan', element: 'danZalohaPoSleve', csszId: '10305', label: 'Sražená záloha na daň po slevách', type: 'number' },
    { section: 'souhrnDataZec/zalohaNaDan', element: 'danBonus', csszId: '10306', label: 'Měsíční daňový bonus', type: 'number' },

    { section: 'souhrnDataZec/zvlastniSazbaDane', element: 'zakladDane', csszId: '10307', label: 'Základ daně podle zvláštní sazby', type: 'number' },
    { section: 'souhrnDataZec/zvlastniSazbaDane', element: 'srazenaDan', csszId: '10309', label: 'Sražená daň podle zvláštní sazby (měsíc)', type: 'number' },
    { section: 'souhrnDataZec/zvlastniSazbaDane', element: 'odmenaNerezident', csszId: '10308', label: 'Odměna člena (nerezidenta) orgánu PO', type: 'number' },
    { section: 'souhrnDataZec/zvlastniSazbaDane', element: 'srazenaDanNerezident', csszId: '10310', label: 'Sražená daň nerezidenta člena orgánu PO', type: 'number' },

    { section: 'souhrnDataZec', element: 'prohlaseniPoplatnika', csszId: '10419', label: 'Prohlášení poplatníka daně', type: 'boolean' },

    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane', element: 'zakladniSleva', csszId: '10299', label: 'Základní sleva na poplatníka', type: 'number' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane', element: 'zakladniSlevaInvalidita12', csszId: '10300', label: 'Sleva na invaliditu I./II. stupně', type: 'number' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane', element: 'rozsirenaSlevaInvalidita3', csszId: '10301', label: 'Sleva na invaliditu III. stupně', type: 'number' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane', element: 'slevaZTPP', csszId: '10302', label: 'Sleva na držitele ZTP/P', type: 'number' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane', element: 'danoveZvyhodneniDetiMesic', csszId: '10303', label: 'Měsíční daňové zvýhodnění na děti', type: 'number' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane', element: 'slevaDite', csszId: '10304', label: 'Měsíční sleva na děti', type: 'number' },

    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic', element: 'vyzivujeJinaOsoba', csszId: '10453', label: 'Vyživuje děti i jiná osoba', type: 'boolean' },

    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/jineOsoby/jinaOsoba', element: 'jmeno', csszId: '10431', label: 'Jméno jiné osoby', type: 'text' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/jineOsoby/jinaOsoba', element: 'prijmeni', csszId: '10432', label: 'Příjmení jiné osoby', type: 'text' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/jineOsoby/jinaOsoba', element: 'datumNarozeni', csszId: '10433', label: 'Datum narození jiné osoby', type: 'date' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/jineOsoby/jinaOsoba', element: 'rodneCislo', csszId: '10434', label: 'Rodné číslo jiné osoby', type: 'text' },

    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite', element: 'dite/jmeno', csszId: '10435', label: 'Jméno dítěte', type: 'text' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite', element: 'dite/prijmeni', csszId: '10436', label: 'Příjmení dítěte', type: 'text' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite', element: 'dite/datumNarozeni', csszId: '10437', label: 'Datum narození dítěte', type: 'date' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite', element: 'dite/rodneCislo', csszId: '10438', label: 'Rodné číslo dítěte', type: 'text' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite', element: 'prukazZtpp', csszId: '10439', label: 'Držitel průkazu ZTP/P', type: 'boolean' },
    { section: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite', element: 'poradi', csszId: '10440', label: 'Pořadí dítěte (1/2/3/N)', type: 'text' },

    { section: 'souhrnDataZec/mzdaCista', element: 'mzdaCista', csszId: '10344', label: 'Čistý příjem', type: 'number' },
    { section: 'souhrnDataZec/mzdaCista', element: 'srazkyZeMzdyEvidovany', csszId: '10116', label: 'Evidovány srážky ze mzdy', type: 'boolean' },

    { section: 'souhrnDataZec/mzdaCista/vydelekOZP', element: 'mzdaOzpUhradaDatum', csszId: '10347', label: 'Datum úhrady mzdy OZP', type: 'date' },
    { section: 'souhrnDataZec/mzdaCista/vydelekOZP', element: 'mzdaOzpHotovost', csszId: '10348', label: 'Mzda vyplacena v hotovosti', type: 'boolean' },
    { section: 'souhrnDataZec/mzdaCista/vydelekOZP', element: 'mzdaOzpSrazka', csszId: '10349', label: 'Provedeny srážky ze mzdy OZP', type: 'boolean' },

    { section: 'souhrnDataZec/mzdaCista/srazky', element: 'srazkaPlneniZel', csszId: '10350', label: 'Srážky k uspokojení plnění zaměstnavatele', type: 'number' },
    { section: 'souhrnDataZec/mzdaCista/srazky', element: 'srazkaSkodaZec', csszId: '10351', label: 'Srážky k uhrazení škody zaměstnance', type: 'number' },
    { section: 'souhrnDataZec/mzdaCista/srazky', element: 'srazkaStrava', csszId: '10352', label: 'Srážky na závodní stravování', type: 'number' },
    { section: 'souhrnDataZec/mzdaCista/srazky', element: 'srazkaZavazkyZec', csszId: '10353', label: 'Srážky k uspokojení závazků zaměstnance', type: 'number' },

    { section: 'souhrnDataZec/zdravPojZamestnavatel', element: 'zdravotniPojisteni', csszId: '10482', label: 'Zdravotní pojištění za zaměstnavatele', type: 'number' },
    { section: 'souhrnDataZec/zdravPojZamestnanec', element: 'zdravotniPojisteni', csszId: '10371', label: 'Zdravotní pojištění za zaměstnance', type: 'number' },

    { section: 'pojisteni/trvani', element: 'pojisteniOd', csszId: '10354', label: 'Pojištění od', type: 'date' },
    { section: 'pojisteni/trvani', element: 'pojisteniDo', csszId: '10355', label: 'Pojištění do', type: 'date' },

    { section: 'pojisteni/vymerovaciZaklad', element: 'castkaOdvodPojistneho', csszId: '10477', label: 'Vyměřovací základ - odvod pojistného', type: 'number' },
    { section: 'pojisteni/vymerovaciZaklad', element: 'prijemNepojistenaCinnost', csszId: '10476', label: 'Příjem z nepojištěné činnosti', type: 'number' },

    { section: 'pojisteni/vymerovaciZakladParagraf5', element: 'pismenoA', csszId: '10478', label: 'VZ § 5a odst. 1 písm. a)', type: 'number' },
    { section: 'pojisteni/vymerovaciZakladParagraf5', element: 'pismenoB', csszId: '10479', label: 'VZ § 5a odst. 1 písm. b)', type: 'number' },
    { section: 'pojisteni/vymerovaciZakladParagraf5', element: 'pismenoC', csszId: '10480', label: 'VZ § 5a odst. 1 písm. c)', type: 'number' },

    { section: 'pojisteni/eldpObdobi/obdobi', element: 'mesic', csszId: '10537', label: 'Měsíc ELDP období', type: 'number' },
    { section: 'pojisteni/eldpObdobi/obdobi', element: 'rok', csszId: '10538', label: 'Rok ELDP období', type: 'number' },

    { section: 'pojisteni/eldpSeznam/eldp', element: 'kod', csszId: '10240', label: 'Kód ELDP', type: 'text' },
    { section: 'pojisteni/eldpSeznam/eldp', element: 'platnostOd', csszId: '10241', label: 'Platnost kódu od', type: 'date' },
    { section: 'pojisteni/eldpSeznam/eldp', element: 'platnostDo', csszId: '10242', label: 'Platnost kódu do', type: 'date' },
    { section: 'pojisteni/eldpSeznam/eldp', element: 'pocetDnu', csszId: '10356', label: 'Počet kalendářních dnů pojištění', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp', element: 'vymerovaciZaklad', csszId: '10245', label: 'Vyměřovací základ ELDP', type: 'number' },

    { section: 'pojisteni/eldpSeznam/eldp/vylouceneDny', element: 'vylouceneDobyCelkem', csszId: '10357', label: 'Vyloučené doby celkem', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/vylouceneDny', element: 'docasNeschopnost', csszId: '10358', label: 'Dočasná pracovní neschopnost', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/vylouceneDny', element: 'penezitaPomocMaterstvi', csszId: '10359', label: 'Peněžitá pomoc v mateřství', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/vylouceneDny', element: 'osetrovaniClenaRodiny', csszId: '10360', label: 'Ošetřování člena rodiny', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/vylouceneDny', element: 'otcovska', csszId: '10362', label: 'Otcovská', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/vylouceneDny', element: 'vyloucenePar16', csszId: '10536', label: 'Vyloučené dny § 16 odst. 4 písm. j)', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/vylouceneDny', element: 'vyloucenePar18', csszId: '10366', label: 'Vyloučené dny § 18 odst. 7', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/vylouceneDny', element: 'omluvenaNepritomnost', csszId: '10473', label: 'Omluvená nepřítomnost (neplacené volno)', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/vylouceneDny', element: 'pracovniNeschopnost', csszId: '10474', label: 'Pracovní neschopnost s náhradou příjmu', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/vylouceneDny', element: 'vyplaceniDavek', csszId: '10475', label: 'Vyplácení dávek nemocenského pojištění', type: 'number' },

    { section: 'pojisteni/eldpSeznam/eldp/odecitaneDny', element: 'odecitaneDobyCelkem', csszId: '10375', label: 'Odečítané doby celkem', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/odecitaneDny', element: 'pracovniNeschopnost', csszId: '10462', label: 'Pracovní neschopnost (karanténa)', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/odecitaneDny', element: 'materstvi', csszId: '10463', label: 'Peněžitá pomoc v mateřství', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/odecitaneDny', element: 'osetrovaniSNarokem', csszId: '10464', label: 'Ošetřování s nárokem na ošetřovné', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/odecitaneDny', element: 'osetrovaniBezNaroku', csszId: '10465', label: 'Ošetřování bez nároku na ošetřovné', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/odecitaneDny', element: 'otcovska', csszId: '10466', label: 'Otcovská', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/odecitaneDny', element: 'neplaceneVolno', csszId: '10468', label: 'Neplacené volno', type: 'number' },
    { section: 'pojisteni/eldpSeznam/eldp/odecitaneDny', element: 'neomluveneAbsence', csszId: '10469', label: 'Neomluvená absence', type: 'number' },

    { section: 'pojisteni/pojisteniZamestnanec', element: 'socialniPojisteni', csszId: '10370', label: 'Sociální pojištění za zaměstnance', type: 'number' },
    { section: 'pojisteni/pojisteniZamestnavatel', element: 'socialniPojisteni', csszId: '10481', label: 'Sociální pojištění za zaměstnavatele', type: 'number' },

    { section: 'pojisteni/slevaZamestnance', element: 'slevaZamestnanceEvidovana', csszId: '10490', label: 'Sleva na pojistném pracující důchodci', type: 'boolean' },
    { section: 'pojisteni/slevaZamestnance', element: 'slevaZamestnance/vyseSlevy', csszId: '10491', label: 'Výše slevy pracující důchodci', type: 'number' },
    { section: 'pojisteni/slevaZamestnance', element: 'slevaZamestnanceOvoZelEvidovana', csszId: '10546', label: 'Sleva na pojistném ovocnářství/zeleniny', type: 'boolean' },
    { section: 'pojisteni/slevaZamestnance', element: 'slevaZamestnanceOvoZel/vyseSlevy', csszId: '10547', label: 'Výše slevy ovocnářství/zeleniny', type: 'number' },

    { section: 'pojisteni/slevaZamestnavatele', element: 'slevaZamestnavateleEvidovana', csszId: '10372', label: 'Sleva na pojistném zaměstnavatele', type: 'boolean' },
    { section: 'pojisteni/slevaZamestnavatele/slevaZamestnavateleRozpad', element: 'pracovniDobaKratsi', csszId: '10373', label: 'Rozsah kratší pracovní doby', type: 'number' },
    { section: 'pojisteni/slevaZamestnavatele/slevaZamestnavateleRozpad', element: 'duvodUplatneni', csszId: '10374', label: 'Důvod uplatnění slevy', type: 'text' },

    { section: 'vykonavanaPozice/mistoVykonuPrace', element: 'obec', csszId: '10229', label: 'Obec', type: 'text' },
    { section: 'vykonavanaPozice/mistoVykonuPrace', element: 'kodObce', csszId: '10230', label: 'Kód obce', type: 'text' },
    { section: 'vykonavanaPozice/mistoVykonuPrace', element: 'kodStatu', csszId: '10231', label: 'Kód státu', type: 'text' },
    { section: 'vykonavanaPozice', element: 'uplatnujiPrispevekApz', csszId: '10232', label: 'Mzdový příspěvek APZ', type: 'boolean' },
    { section: 'vykonavanaPozice', element: 'nastrojApzKod', csszId: '10233', label: 'Nástroj APZ (kód)', type: 'text' },
    { section: 'vykonavanaPozice', element: 'funkcniPozitky', csszId: '10247', label: 'Funkční požitky § 6 odst. 10 ZDP', type: 'boolean' },
    { section: 'vykonavanaPozice', element: 'docasnePrideleniEvidovano', csszId: '10251', label: 'Dočasné přidělení evidováno', type: 'boolean' },

    { section: 'vykonavanaPozice/docasnePrideleni/uzivatel', element: 'ico', csszId: '10252', label: 'IČO uživatele', type: 'text' },
    { section: 'vykonavanaPozice/docasnePrideleni/uzivatel', element: 'rodneCislo', csszId: '10457', label: 'Rodné číslo uživatele', type: 'text' },
    { section: 'vykonavanaPozice/docasnePrideleni/uzivatel', element: 'zahranicniOsoba/kodStatu', csszId: '10492', label: 'Kód státu zahraniční osoby', type: 'text' },
    { section: 'vykonavanaPozice/docasnePrideleni/uzivatel', element: 'zahranicniOsoba/identifikace', csszId: '10493', label: 'Registrační číslo zahraniční osoby', type: 'text' },
    { section: 'vykonavanaPozice/docasnePrideleni/uzivatel', element: 'zahranicniOsoba/nazev', csszId: '10494', label: 'Název zahraniční osoby', type: 'text' },

    { section: 'vykonavanaPozice/fondPracovniDoby', element: 'stanovenyFond', csszId: '10259', label: 'Stanovený fond pracovní doby (h/měs)', type: 'number' },
    { section: 'vykonavanaPozice/fondPracovniDoby', element: 'sjednanyFond', csszId: '10260', label: 'Sjednaný fond pracovní doby (h/měs)', type: 'number' },
    { section: 'vykonavanaPozice/fondPracovniDoby', element: 'stanovenaTydenniDoba', csszId: '10261', label: 'Stanovená týdenní pracovní doba', type: 'number' },

    { section: 'prubehZamestnani/odpracovaneDny', element: 'dnyEvidencniStav', csszId: '10265', label: 'Počet dní v evidenčním stavu', type: 'number' },

    { section: 'prubehZamestnani/odpracovaneHodiny', element: 'pocet', csszId: '10268', label: 'Počet odpracovaných hodin', type: 'number' },
    { section: 'prubehZamestnani/odpracovaneHodiny/rozpad', element: 'prescas', csszId: '10269', label: 'Přesčasové hodiny', type: 'number' },

    { section: 'prubehZamestnani/odpracovaneHodiny/rozpad/hornictvi', element: 'smenyUran', csszId: '10270', label: 'Směny hlubinné hornictví - uran', type: 'number' },
    { section: 'prubehZamestnani/odpracovaneHodiny/rozpad/hornictvi', element: 'smenyOstatni', csszId: '10271', label: 'Směny hlubinné hornictví - ostatní', type: 'number' },
    { section: 'prubehZamestnani/odpracovaneHodiny/rozpad/hornictvi', element: 'expoziceNpeDosazeniDatum', csszId: '10272', label: 'Datum dosažení expozice NPE', type: 'date' },

    { section: 'prubehZamestnani/odpracovaneHodiny/rozpad/riziko', element: 'hodinyOdpracovanePocet', csszId: '10273', label: 'Odpracované hodiny rizikové práce', type: 'number' },
    { section: 'prubehZamestnani/odpracovaneHodiny/rozpad/riziko', element: 'kategorizaceRizika', csszId: '10274', label: 'Kategorizace rizika', type: 'text' },

    { section: 'prubehZamestnani/neodpracovaneHodiny', element: 'hodinyNeodpracCelkem', csszId: '10275', label: 'Neodpracované hodiny celkem', type: 'number' },
    { section: 'prubehZamestnani/neodpracovaneHodiny', element: 'hodinyNeodpracNahrada', csszId: '10276', label: 'Neodpracované hodiny s náhradou', type: 'number' },
    { section: 'prubehZamestnani/neodpracovaneHodiny', element: 'hodinyNeodpracBezNahrady', csszId: '10277', label: 'Neodpracované hodiny DPN bez náhrady', type: 'number' },
    { section: 'prubehZamestnani/neodpracovaneHodiny', element: 'hodinyNeodpracNeschop', csszId: '10278', label: 'Neodpracované hodiny DPN s náhradou', type: 'number' },
    { section: 'prubehZamestnani/neodpracovaneHodiny', element: 'hodinyNeodpracDovol', csszId: '10279', label: 'Neodpracované hodiny dovolená', type: 'number' },
    { section: 'prubehZamestnani/neodpracovaneHodiny', element: 'hodinyNeodpracOcr', csszId: '10280', label: 'Neodpracované hodiny OČR', type: 'number' },

    { section: 'prubehZamestnani/prekazkyVPraci', element: 'prekazkaZamestnanec', csszId: '10471', label: 'Překážky v práci - zaměstnanec', type: 'number' },
    { section: 'prubehZamestnani/prekazkyVPraci', element: 'prekazkaZamestnavatel', csszId: '10472', label: 'Překážky v práci - zaměstnavatel', type: 'number' },

    { section: 'prijem/dan', element: 'zakladDane', csszId: '10535', label: 'Základ pro výpočet daně', type: 'number' },
    { section: 'prijem/specifickaSkutecnost', element: 'vyplatniTermin', csszId: '10410', label: 'Výplatní termín při specifické skutečnosti', type: 'date' },
    { section: 'souhrn/specifickaSkutecnost', element: 'typ', csszId: '10408', label: 'Typ specifické právní skutečnosti', type: 'text' },

    { section: 'teoretickaPraktickaPriprava/obdobi', element: 'datumOd', csszId: '10263', label: 'Datum od (TPP)', type: 'date' },
    { section: 'teoretickaPraktickaPriprava/obdobi', element: 'datumDo', csszId: '10264', label: 'Datum do (TPP)', type: 'date' },

    { section: 'mzda', element: 'mzdaZuctovana', csszId: '10328', label: 'Mzda zúčtovaná', type: 'number' },
    { section: 'mzda/mzdaRozpad', element: 'tarif', csszId: '10329', label: 'Tarifní mzdy', type: 'number' },
    { section: 'mzda/mzdaRozpad', element: 'odmenyPravidelne', csszId: '10330', label: 'Prémie a odměny pravidelné', type: 'number' },
    { section: 'mzda/mzdaRozpad', element: 'odmenyNepravidelne', csszId: '10331', label: 'Prémie a odměny nepravidelné', type: 'number' },

    { section: 'mzda/mzdaRozpad/priplatky', element: 'celkem', csszId: '10332', label: 'Příplatky celkem', type: 'number' },
    { section: 'mzda/mzdaRozpad/priplatky', element: 'prescas', csszId: '10333', label: 'Příplatky za přesčas', type: 'number' },
    { section: 'mzda/mzdaRozpad/priplatky', element: 'nocni', csszId: '10334', label: 'Příplatky za noční práci', type: 'number' },
    { section: 'mzda/mzdaRozpad/priplatky', element: 'sobotaNedele', csszId: '10335', label: 'Příplatky za soboty a neděle', type: 'number' },
    { section: 'mzda/mzdaRozpad/priplatky', element: 'svatek', csszId: '10336', label: 'Příplatky za svátek', type: 'number' },

    { section: 'mzda/nahrady', element: 'mzdyZuctovane', csszId: '10337', label: 'Náhrady mzdy zúčtované', type: 'number' },
    { section: 'mzda/nahrady', element: 'dovolena', csszId: '10338', label: 'Náhrady za dovolenou', type: 'number' },
    { section: 'mzda/nahrady', element: 'svatky', csszId: '10339', label: 'Náhrady za svátky', type: 'number' },
    { section: 'mzda/nahrady', element: 'prekazkyZamestnavatel', csszId: '10340', label: 'Náhrady - překážky zaměstnavatele', type: 'number' },
    { section: 'mzda/nahrady', element: 'prekazkyZamestnanec', csszId: '10341', label: 'Náhrady - překážky zaměstnance', type: 'number' },
    { section: 'mzda/nahrady', element: 'docasnaNeschopnost', csszId: '10342', label: 'Náhrady při DPN', type: 'number' },

    { section: 'mzda/odmeny', element: 'pohotovost', csszId: '10343', label: 'Odměny za pracovní pohotovost', type: 'number' },

    { section: 'mzda/vydelek', element: 'vydelekPrumernyHod', csszId: '10345', label: 'Průměrný hodinový výdělek', type: 'number' },

    { section: 'prispevekZamestnavateleOstatni', element: 'prispevekZelPojDlPece', csszId: '10418', label: 'Příspěvek na pojištění dlouhodobé péče', type: 'number' },
    { section: 'prispevekZamestnavateleOstatni', element: 'prispevekPenzPripoj', csszId: '10292', label: 'Příspěvek na penzijní připojištění', type: 'number' },
    { section: 'prispevekZamestnavateleOstatni', element: 'prispevekDoplnPenzPripoj', csszId: '10293', label: 'Příspěvek na doplňkové penzijní spoření', type: 'number' },
    { section: 'prispevekZamestnavateleOstatni', element: 'prispevekPenzPoj', csszId: '10294', label: 'Příspěvek na penzijní pojištění', type: 'number' },
    { section: 'prispevekZamestnavateleOstatni', element: 'prispevekZivotPoj', csszId: '10295', label: 'Příspěvek na soukromé životní pojištění', type: 'number' },
    { section: 'prispevekZamestnavateleOstatni', element: 'prispevekDip', csszId: '10296', label: 'Příspěvek na dlouhodobý investiční produkt', type: 'number' },

    { section: 'prubehZamestnani/odpracovaneDny', element: 'dnyOdpracovanePocet', csszId: '10267', label: 'Počet odpracovaných dnů', type: 'number' },

    { section: 'souhrnDataZec/rocniUhrny', element: 'prijemSrazkDanZvlSazba', csszId: '10311', label: 'Příjmy podléhající srážkové dani (rok)', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny', element: 'danSrazenaZvlSazba', csszId: '10312', label: 'Sražená daň zvláštní sazby (rok)', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny', element: 'prijemZdanitelnyCelkem', csszId: '10313', label: 'Zdanitelné příjmy celkem (rok)', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny', element: 'prijemZdanitelnyDoplatek', csszId: '10316', label: 'Doplatky příjmů z minulých období (rok)', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny', element: 'zalohaPrijmy', csszId: '10317', label: 'Sražená záloha na daň z příjmů (rok)', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny', element: 'zalohaDoplatky', csszId: '10318', label: 'Sražená záloha na daň z doplatků (rok)', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny', element: 'rocniZuctovaniZadost', csszId: '10319', label: 'Požádáno o roční zúčtování', type: 'boolean' },
    { section: 'souhrnDataZec/rocniUhrny', element: 'rocniZuctovaniProvedeno', csszId: '10320', label: 'Roční zúčtování provedeno', type: 'boolean' },

    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani', element: 'preplatekRok', csszId: '10321', label: 'Přeplatek/nedoplatek z ročního zúčtování', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani', element: 'danPreplatekRok', csszId: '10322', label: 'Přeplatek/nedoplatek na dani', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani', element: 'danBonusPreplatekRok', csszId: '10323', label: 'Doplatek/přeplatek daňového bonusu', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani', element: 'uplatnenaSlevaNaPartnera', csszId: '10420', label: 'Uplatněna sleva na manželku/manžela', type: 'boolean' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani', element: 'uplatnenoZvyhodneniNaDeti', csszId: '10454', label: 'Uplatněno daňové zvýhodnění na děti', type: 'boolean' },

    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'partnerUdaje/jmeno', csszId: '10421', label: 'Jméno partnera', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'partnerUdaje/prijmeni', csszId: '10422', label: 'Příjmení partnera', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'partnerUdaje/rodneCislo', csszId: '10423', label: 'Rodné číslo partnera', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'partnerUdaje/datumNarozeni', csszId: '10424', label: 'Datum narození partnera', type: 'date' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'prukazZtpp', csszId: '10425', label: 'Partner držitel ZTP/P', type: 'boolean' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'slevaPocetMesicu', csszId: '10426', label: 'Počet měsíců uplatnění slevy', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'slevaPocetMesicuZtpp', csszId: '10430', label: 'Počet měsíců ZTP/P', type: 'number' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'deti/dite/jmeno', csszId: '10539', label: 'Jméno dítěte partnera', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'deti/dite/prijmeni', csszId: '10540', label: 'Příjmení dítěte partnera', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'deti/dite/datumNarozeni', csszId: '10541', label: 'Datum narození dítěte partnera', type: 'date' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner', element: 'deti/dite/rodneCislo', csszId: '10542', label: 'Rodné číslo dítěte partnera', type: 'text' },

    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti', element: 'vyzivujeJinaOsoba', csszId: '10455', label: 'Vyživuje děti i jiná osoba (roční)', type: 'boolean' },

    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/jineOsoby/jinaOsoba', element: 'osoba/jmeno', csszId: '10441', label: 'Jméno jiné osoby', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/jineOsoby/jinaOsoba', element: 'osoba/prijmeni', csszId: '10442', label: 'Příjmení jiné osoby', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/jineOsoby/jinaOsoba', element: 'osoba/datumNarozeni', csszId: '10443', label: 'Datum narození jiné osoby', type: 'date' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/jineOsoby/jinaOsoba', element: 'osoba/rodneCislo', csszId: '10444', label: 'Rodné číslo jiné osoby', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/jineOsoby/jinaOsoba', element: 'mesiceVyzivovani', csszId: '10445', label: 'Měsíce vyživování (12 znaků A/N)', type: 'text' },

    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite', element: 'dite/jmeno', csszId: '10446', label: 'Jméno dítěte', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite', element: 'dite/prijmeni', csszId: '10447', label: 'Příjmení dítěte', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite', element: 'dite/datumNarozeni', csszId: '10448', label: 'Datum narození dítěte', type: 'date' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite', element: 'dite/rodneCislo', csszId: '10449', label: 'Rodné číslo dítěte', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite', element: 'prukazZtpp', csszId: '10450', label: 'ZTP/P (12 znaků A/N)', type: 'text' },
    { section: 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite', element: 'poradi', csszId: '10451', label: 'Pořadí (12 znaků 1-3/N)', type: 'text' },
  ],
  actionLabels: null,
  actionSections: null,
  fieldRules: null,
  foreignKeywords: null,
  getRowLabel: function(fields) { return fields['identifikace/idPpv']?.value || ''; },
  rowColumnLabel: 'ID PPV',
  getRowInfo: [
    { key: 'identifikace/ikMpsv', label: 'IK MPSV' },
    { key: 'identifikace/idPpv', label: 'ID PPV' }
  ],
  stats: {
    employer: null,
    date: null,
    citizenship: null,
    action: null,
    partialAccept: false
  },
  formVariants: ['bezPriznaku', 'odlozenyPrijem', 'pestoun', 'cinnostKS', 'vezen', 'mezinarodniPronajemSily', 'jinyPrijem', 'ozpTpp'],
  resolveSection: function(formRoot, sec, rowEl) {
    if (sec._resolveSelf) return formRoot;
    if (!isJmhzSectionAllowed(formRoot, sec)) return null;
    const parts = (sec._resolvePath || sec.id).split('/');
    let el = sec._resolveFromRow ? (rowEl || (formRoot && formRoot.parentElement) || null) : formRoot;
    for (const part of parts) {
      if (!el) return null;
      el = getChildByLocalNameNS(el, part, 'http://schemas.cssz.cz/JMHZ/form/1.0') || getChildByLocalName(el, part);
    }
    return el;
  },
  isSectionAllowed: isJmhzSectionAllowed,
  isFieldAllowed: isJmhzFieldAllowed,
  ensureSectionPath: function(formRoot, sec, rowEl) {
    if (!isJmhzSectionAllowed(formRoot, sec)) return null;
    const ns = 'http://schemas.cssz.cz/JMHZ/form/1.0';
    const parts = (sec._resolvePath || sec.id).split('/');
    let el = sec._resolveFromRow ? (rowEl || (formRoot && formRoot.parentElement) || null) : formRoot;
    const sectionChildOrder = buildJmhzChildOrder(this);
    let pathSoFar = '';
    for (const part of parts) {
      if (!el) return null;
      let child = getChildByLocalNameNS(el, part, ns) || getChildByLocalName(el, part);
      if (!child) {
        child = el.ownerDocument.createElementNS(ns, 'form:' + part);
        insertInSchemaOrder(el, child, sectionChildOrder[pathSoFar]);
      }
      pathSoFar = pathSoFar ? pathSoFar + '/' + part : part;
      el = child;
    }
    return el;
  },
  resolveSectionInstances: function(formRoot, sec) {
    if (!sec.repeating && !sec.parentRepeating) return null;
    if (!formRoot) return [];
    const ns = 'http://schemas.cssz.cz/JMHZ/form/1.0';
    const repeatingSectionId = sec.parentRepeating || sec.id;
    if (repeatingSectionId === 'pojisteni/eldpSeznam/eldp') {
      const pojisteni = getChildByLocalNameNS(formRoot, 'pojisteni', ns) || getChildByLocalName(formRoot, 'pojisteni');
      if (!pojisteni) return [];
      let instances = getAllChildrenByLocalNameNS(getChildByLocalNameNS(pojisteni, 'eldpSeznam', ns) || getChildByLocalName(pojisteni, 'eldpSeznam'), 'eldp', ns);
      if (!instances.length) {
        const eldpObdobi = getChildByLocalNameNS(pojisteni, 'eldpObdobi', ns) || getChildByLocalName(pojisteni, 'eldpObdobi');
        if (eldpObdobi) {
          const collected = [];
          let obdobiEls = getAllChildrenByLocalNameNS(eldpObdobi, 'obdobi', ns);
          if (!obdobiEls.length) obdobiEls = getAllChildrenByLocalNameNS(eldpObdobi, 'obdobi', null);
          obdobiEls.forEach(obd => {
            const eldpSeznam = getChildByLocalNameNS(obd, 'eldpSeznam', ns) || getChildByLocalName(obd, 'eldpSeznam');
            if (!eldpSeznam) return;
            let eldpEls = getAllChildrenByLocalNameNS(eldpSeznam, 'eldp', ns);
            if (!eldpEls.length) eldpEls = getAllChildrenByLocalNameNS(eldpSeznam, 'eldp', null);
            collected.push(...eldpEls);
          });
          instances = collected;
        }
      }
      if (sec.parentRepeating) {
        const remainingParts = sec.id.split('/').slice(repeatingSectionId.split('/').length);
        return instances.map((inst, i) => {
          let sub = inst;
          for (const rp of remainingParts) {
            if (!sub) break;
            sub = getChildByLocalNameNS(sub, rp, ns) || getChildByLocalName(sub, rp);
          }
          return { index: i, el: sub, _orderValue: null };
        });
      }
      return instances.map((inst, i) => ({ index: i, el: inst, _orderValue: null }));
    }
    const repeatParts = repeatingSectionId.split('/');
    const repeatElement = repeatParts[repeatParts.length - 1];
    const containerParts = repeatParts.slice(0, -1);
    let container = formRoot;
    for (const part of containerParts) {
      if (!container) return [];
      container = getChildByLocalNameNS(container, part, ns) || getChildByLocalName(container, part);
    }
    if (!container) return [];
    let instances = getAllChildrenByLocalNameNS(container, repeatElement, ns);
    if (instances.length === 0) instances = getAllChildrenByLocalNameNS(container, repeatElement, null);
    // Sort by orderElement if defined (e.g. poradi for vyzivovaneDite)
    const orderEl = sec.orderElement;
    if (orderEl && instances.length > 1) {
      instances.sort((a, b) => {
        const aVal = getChildByLocalName(a, orderEl)?.textContent || '';
        const bVal = getChildByLocalName(b, orderEl)?.textContent || '';
        const aParsed = parseInt(aVal, 10);
        const bParsed = parseInt(bVal, 10);
        const aNum = aVal ? (isNaN(aParsed) ? Infinity : aParsed) : Infinity;
        const bNum = bVal ? (isNaN(bParsed) ? Infinity : bParsed) : Infinity;
        return aNum - bNum;
      });
    }
    if (sec.parentRepeating) {
      const remainingParts = sec.id.split('/').slice(repeatParts.length);
      return instances.map((inst, i) => {
        let sub = inst;
        for (const rp of remainingParts) {
          if (!sub) break;
          sub = getChildByLocalNameNS(sub, rp, ns) || getChildByLocalName(sub, rp);
        }
        return { index: i, el: sub, _orderValue: orderEl ? (getChildByLocalName(inst, orderEl)?.textContent || '') : null };
      });
    }
    return instances.map((inst, i) => ({ index: i, el: inst, _orderValue: orderEl ? (getChildByLocalName(inst, orderEl)?.textContent || '') : null }));
  },
  createRepeatingInstance: function(formRoot, sec) {
    if (!isJmhzSectionAllowed(formRoot, sec)) return null;
    const ns = 'http://schemas.cssz.cz/JMHZ/form/1.0';
    const childOrder = buildJmhzChildOrder(this);
    const sectionId = sec.parentRepeating || sec.id;
    const parts = sectionId.split('/');
    const childName = parts[parts.length - 1];
    const containerParts = parts.slice(0, -1);
    let container = formRoot;
    for (let i = 0; i < containerParts.length; i++) {
      const part = containerParts[i];
      let next = getChildByLocalNameNS(container, part, ns) || getChildByLocalName(container, part);
      if (!next) {
        next = container.ownerDocument.createElementNS(ns, 'form:' + part);
        const parentPath = containerParts.slice(0, i).join('/');
        insertInSchemaOrder(container, next, childOrder[parentPath]);
      }
      container = next;
    }
    const newEl = container.ownerDocument.createElementNS(ns, 'form:' + childName);
    insertInSchemaOrder(container, newEl, childOrder[containerParts.join('/')]);
    return newEl;
  },
  headerFields: [],
  normalizeBooleanForUi: function(value) {
    if (value == null) return '';
    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return '';
    if (normalized === 'true' || normalized === '1') return 'A';
    if (normalized === 'false' || normalized === '0') return 'N';
    return value;
  },
  normalizeBooleanForXml: function(value) {
    if (value == null) return '';
    const normalized = String(value).trim().toUpperCase();
    if (!normalized) return '';
    if (normalized === 'A') return 'true';
    if (normalized === 'N') return 'false';
    return value;
  },
  readField: function(targetEl, field) {
    if (!targetEl) return '';
    const elName = field.element || field.attr;
    const parts = elName.split('/');
    let el = targetEl;
    for (const part of parts) {
      el = getChildByLocalName(el, part);
      if (!el) return '';
    }
    const value = el.textContent || '';
    return field.type === 'boolean' ? this.normalizeBooleanForUi(value) : value;
  },
  writeField: function(fieldRef, value) {
    if (!isJmhzFieldAllowed(fieldRef.el, fieldRef._field)) {
      throw new Error('Field is not allowed for this JMHZ form variant');
    }
    const ns = 'http://schemas.cssz.cz/JMHZ/form/1.0';
    const elName = fieldRef._field?.element || fieldRef._field?.attr || fieldRef.attr;
    const parts = elName.split('/');
    let el = fieldRef.el;
    const childOrder = buildJmhzChildOrder(this);
    let pathSoFar = fieldRef._field?.section || '';
    for (const part of parts) {
      let child = getChildByLocalName(el, part);
      if (!child) {
        // Detect indentation: first try trailing text node inside parent,
        // then fall back to preceding sibling text node (for empty/self-closing elements)
        var indent = '';
        var trailingTextNode = null;
        if (el.lastChild && el.lastChild.nodeType === 3) {
          var m = el.lastChild.textContent.match(/\n([ \t]+)$/);
          if (m) { indent = m[1]; trailingTextNode = el.lastChild; }
        }
        if (!indent && el.previousSibling && el.previousSibling.nodeType === 3) {
          var m2 = el.previousSibling.textContent.match(/\n([ \t]+)$/);
          if (m2) { indent = m2[1]; }
        }
        var childIndent = indent ? indent + '\t' : '';
        child = el.ownerDocument.createElementNS(ns, 'form:' + part);
        const ref = findSchemaOrderRef(el, child, childOrder[pathSoFar]);
        if (ref) {
          el.insertBefore(child, ref);
        } else if (trailingTextNode) {
          el.insertBefore(el.ownerDocument.createTextNode('\n' + childIndent), trailingTextNode);
          el.insertBefore(child, trailingTextNode);
        } else if (childIndent) {
          el.appendChild(el.ownerDocument.createTextNode('\n' + childIndent));
          el.appendChild(child);
          el.appendChild(el.ownerDocument.createTextNode('\n' + indent));
        } else {
          el.appendChild(child);
        }
      }
      pathSoFar = pathSoFar ? pathSoFar + '/' + part : part;
      el = child;
    }
    const xmlValue = fieldRef._field?.type === 'boolean' ? this.normalizeBooleanForXml(value) : value;
    el.textContent = xmlValue;
  },
  writeHeaderField: function(headerRef, value) {
    if (headerRef._writeBack === 'attribute') {
      if (value) headerRef.el.setAttribute(headerRef.attr, value);
      else headerRef.el.removeAttribute(headerRef.attr);
    } else {
      headerRef.el.textContent = value;
    }
  },
  fieldAttrKey: function(field) { return field.element || field.attr; },
  fieldXpath: function(field) { return field.section + '/' + (field.element || field.attr); },
  determineRowType: function() { return null; },
  rowElementPattern: /<[a-zA-Z]*:?formularOsoby[\s>]/,
  sanitizerMeta: {
    optionalChildren: {
      'PVPOJ': ['slevaZamestnavatele','slevyZamestnancu','slevyZamestnancuOvoZel'],
      'pojistne': ['pojistneZamestnavateleA','pojistneZamestnavateleB','pojistneZamestnavateleC','zakladZamestnavateleA','zakladZamestnavateleB','zakladZamestnavateleC'],
      'slevaZamestnavatele': ['slevaZamestnavateleEvidovana','slevaZamestnavateleRozpad'],
      'bezPriznaku': ['souhrnDataZec'],
      'cinnostKS': ['souhrnDataZec'],
      'jinyPrijem': ['souhrnDataZec'],
      'mezinarodniPronajemSily': ['souhrnDataZec'],
      'odlozenyPrijem': ['souhrnDataZec', 'typOdlozenehoPrijmu'],
      'pestoun': ['souhrnDataZec'],
      'vezen': ['souhrnDataZec'],
      'souhrnDataZec': ['prohlaseniPoplatnikaDane','rocniUhrny','zalohaNaDan','zvlastniSazbaDane'],
      'pojisteni': ['eldpObdobi','eldpSeznam','pojisteniZamestnanec','pojisteniZamestnavatel','slevaZamestnance','slevaZamestnavatele','vymerovaciZaklad','vymerovaciZakladParagraf5'],
      'vykonavanaPozice': ['docasnePrideleni','nastrojApzKod'],
      'prubehZamestnani': ['neodpracovaneHodiny','prekazkyVPraci'],
      'prijem': ['dan','specifickaSkutecnost'],
      'mzda': ['mzdaRozpad','nahrady','odmeny'],
      'prijmy': ['odmenyNerezident','osvobozenoCelkem','prispevekZamestnavatele'],
      'zalohaNaDan': ['danBonus','danZalohaPoSleve','vypoctenaZaloha','zakladDane'],
      'zvlastniSazbaDane': ['odmenaNerezident','srazenaDan','srazenaDanNerezident'],
      'prohlaseniPoplatnikaDane': ['danoveZvyhodneniDetiMesic','rozsirenaSlevaInvalidita3','slevaDite','slevaZTPP','zakladniSleva','zakladniSlevaInvalidita12','zvyhodneniDetiMesic'],
      'rocniUhrny': ['danSrazenaZvlSazba','prijemSrazkDanZvlSazba','prijemZdanitelnyCelkem','prijemZdanitelnyDoplatek','vysledekRocnihoZuctovani','zalohaDoplatky','zalohaPrijmy'],
      'mzdaCista': ['srazky','vydelekOZP'],
      'prispevekZamestnavatele': ['prispevekDip','prispevekDoplnPenzPripoj','prispevekPenzPoj','prispevekPenzPripoj','prispevekZelPojDlPece','prispevekZelSporeniOsvob','prispevekZivotPoj'],
      'srazky': ['srazkaPlneniZel','srazkaSkodaZec','srazkaStrava','srazkaZavazkyZec'],
      'vymerovaciZaklad': ['castkaOdvodPojistneho','prijemNepojistenaCinnost'],
      'vymerovaciZakladParagraf5': ['pismenoA','pismenoB','pismenoC'],
      'slevaZamestnance': ['slevaZamestnance','slevaZamestnanceEvidovana','slevaZamestnanceOvoZel','slevaZamestnanceOvoZelEvidovana','vyseSlevy'],
      'odpracovaneDny': ['dnyOdpracovanePocet'],
      'odpracovaneHodiny': ['rozpad'],
      'neodpracovaneHodiny': ['hodinyNeodpracBezNahrady','hodinyNeodpracDovol','hodinyNeodpracNahrada','hodinyNeodpracNeschop','hodinyNeodpracOcr'],
      'prekazkyVPraci': ['prekazkaZamestnanec','prekazkaZamestnavatel'],
      'mzdaRozpad': ['priplatky'],
      'nahrady': ['docasnaNeschopnost','dovolena','prekazkyZamestnanec','prekazkyZamestnavatel','svatky'],
      'zvyhodneniDetiMesic': ['jineOsoby','vyzivovaneDeti'],
      'jinaOsoba': ['datumNarozeni','rodneCislo'],
      'dite': ['datumNarozeni','rodneCislo'],
      'vysledekRocnihoZuctovani': ['slevaNaPartnera','zvyhodneniNaDeti'],
      'partner': ['slevaPocetMesicuZtpp'],
      'partnerUdaje': ['datumNarozeni','rodneCislo'],
      'zvyhodneniNaDeti': ['jineOsoby'],
      'osoba': ['datumNarozeni','rodneCislo'],
      'rozpad': ['hornictvi','prescas','riziko'],
      'hornictvi': ['expoziceNpeDosazeniDatum','smenyOstatni','smenyUran'],
      'dan': ['zakladDane'],
      'specifickaSkutecnost': ['vyplatniTermin'],
      'priplatky': ['nocni','prescas','sobotaNedele','svatek'],
      'slevaZamestnavateleRozpad': ['pracovniDobaKratsi'],
      'slevaZamestnanceOvoZel': ['vyseSlevy'],
      'eldp': ['kod','odecitaneDny','platnostDo','platnostOd','vylouceneDny','vymerovaciZaklad'],
      'vylouceneDny': ['docasNeschopnost','omluvenaNepritomnost','osetrovaniClenaRodiny','otcovska','penezitaPomocMaterstvi','pracovniNeschopnost','vylouceneDobyCelkem','vyloucenePar16','vyloucenePar18','vyplaceniDavek'],
      'odecitaneDny': ['materstvi','neomluveneAbsence','neplaceneVolno','osetrovaniBezNaroku','osetrovaniSNarokem','otcovska','pracovniNeschopnost'],
      'obdobi': ['mesic','rok'],
      'jmhz': ['SENDER','VENDOR','formulareOsob'],
      'hlavicka': ['balikPoradi','balikyPocet','formularePocetCelkem','formularePocetVBaliku','primarniPpv'],
      'souhrn': ['danUdajeRok','specifickaSkutecnost','zamestnavatelUdajeRok'],
      'danUdajeMesic': ['danBonus'],
      'zamestnavatelUdajeRok': ['zamestnavaniOzp']
    },
    optionalAttrs: null
  },
};
