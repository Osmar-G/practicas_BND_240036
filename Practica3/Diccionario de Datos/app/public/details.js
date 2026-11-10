// Fill illustrative examples from the declared MySQL type; never use INSERT values.
const detailsObserver = new MutationObserver(() => {
  for (const item of document.querySelectorAll('.detail-item')) {
    const label = item.querySelector('label');
    if (label?.textContent !== 'Ejemplo ilustrativo' || item.dataset.exampleReady) continue;
    const columnName = item.closest('details')?.querySelector('summary b')?.textContent;
    const col = schema?.tables.find(t => t.name === selected)?.columns.find(c => c.name === columnName);
    if (!col) continue;
    item.querySelector('div').textContent = `${col.example}. Ejemplo ficticio basado en el tipo, no extraído del respaldo.`;
    item.dataset.exampleReady = 'true';
  }
});
detailsObserver.observe(document.querySelector('#content'), { childList: true, subtree: true });
