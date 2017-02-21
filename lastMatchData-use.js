$.getScript("http://tolueno.fr/liquipedia/lastMatchData/lastMatchData.js", function(){
    $.fn.lastMatchData({
        forceDateToEndDate: false,
        action: 'outputtext',
        output: 'console',
        summary: 'Prize pool last results'
    });
});

$.getScript("http://tolueno.fr/liquipedia/lastMatchData/lastMatchData.js", function(){
    $.fn.lastMatchData({
        forceDateToEndDate: false,
        action: 'outputcode',
        codeForTableOnly: true,
        output: 'console',
        summary: 'Prize pool last results'
    });
});

$.getScript("http://tolueno.fr/liquipedia/lastMatchData/lastMatchData.js", function(){
    $.fn.lastMatchData({
        forceDateToEndDate: false,
        action: 'editpage',
        output: 'console',
        summary: 'Prize pool last results'
    });
});