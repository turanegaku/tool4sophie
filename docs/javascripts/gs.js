/*globals $ d3 Materialize*/

$(() => {
    const search = $('#search');
    const searching = $('.preloader-wrapper.small');
    const result = d3.select('ul#result');
    const isrc = $('input#src');
    const idst = $('input#dst');

    search.removeClass('disabled');

    search.click(() => {
        const src = isrc.val();
        const dst = idst.val();
        if (src) {
            
        }
    });
});
