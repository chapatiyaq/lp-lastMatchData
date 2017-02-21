/*globals $: false, mw: false */
$( document ).ready( function() {

$.fn.lastMatchData = function ( options ) {
    var forceDateToEndDate = options.forceDateToEndDate !== undefined ? options.forceDateToEndDate : false,
        action = options.action !== undefined ? options.action : 'outputtext',
        codeForTableOnly = options.codeForTableOnly !== undefined ? options.codeForTableOnly : false,
        output = options.output !== undefined ? options.output : 'console',
        summary = options.summary !== undefined ? options.summary : 'Prize pool last results';

    Date.prototype.toISODateOnly = function() {
        return this.getFullYear() +
            '-' + ( this.getMonth() < 9 ? 0 : "" ) + ( this.getMonth() + 1 ) +
            '-' + ( this.getDate() < 10 ? 0 : "" ) + this.getDate();
    };

    function parsePlayer ( $playerCell ) {
        var player = { flag: '', race: '', name: '' };
        $playerCell.find( 'img' ).each( function() {
            var filename = $( this ).attr( 'src' ).match( /[^\/]*\.(png|gif)$/ )[ 0 ];
            if ( filename.match( /^( P|T|Z|R )icon_small\.png$/) !== null ) {
                player.race = filename.match( /^( P|T|Z|R )icon_small\.png$/ )[ 1 ].toLowerCase();
            } else if ( filename.match( /^[A-Z][a-z][a-z]?\.(png|gif)$/ ) !== null ) {
                player.flag = filename.match( /^([A-Z][a-z][a-z]?)\.(png|gif)$/ )[ 1 ].toLowerCase( );
            }
        } );
        player.name = $playerCell.text().trim();
        if ( $playerCell.find( 'span > a' ).length > 0 ) {
            var page = $playerCell.find( 'span > a' ).attr( 'title' ).replace( ' ( page does not exist )', '' );
            if ( cleanTitle( page ) != cleanTitle( player.name ) ) {
                player.page = page;
            }
        }
        return player;
    }

    function parsePlayerInPrizePoolTable( $playerCell ) {
        var player = {flag: '', race: '', name: ''};
        $playerCell.find( 'img' ).each( function() {
            var filename = $( this ).attr( 'src' ).match( /[^\/]*\.(png|gif)$/ )[ 0 ];
            if ( filename.match( /^(P|T|Z|R)icon_small\.png$/ ) !== null ) {
                player.race = filename.match( /^(P|T|Z|R)icon_small\.png$/ )[ 1 ].toLowerCase();
            } else if ( filename.match( /^[A-Z][a-z][a-z]?\.(png|gif)$/ ) !== null ) {
                player.flag = filename.match( /^([A-Z][a-z][a-z]?)\.(png|gif)$/ )[ 1 ].toLowerCase();
            }
        } );
        player.name = $playerCell.text().trim();
        if ( $playerCell.find( 'a:nth-child( 3)' ).length > 0 ) {
            var page = $playerCell.find( 'a:nth-child( 3)' ).attr( 'title' ).replace( ' ( page does not exist )', '' );
            if ( cleanTitle( page ) != cleanTitle( player.name ) ) {
                player.page = page;
            }
        }
        return player;
    }

    function parsePlayerInBracket( $playerCell ) {
        var player = {flag: '', race: '', name: ''};
        $playerCell.find( 'img' ).each( function() {
            var filename = $( this ).attr( 'src' ).match( /[^\/]*\.(png|gif)$/ )[ 0 ];
            if ( filename.match( /^[A-Z][a-z][a-z]?\.(png|gif)$/ ) !== null ) {
                player.flag = filename.match( /^([A-Z][a-z][a-z]?)\.(png|gif)$/ )[ 1 ].toLowerCase( );
            }
        } );
        var raceColorMatch = $playerCell.css( 'background' ).match( /rgba?\(( [^0][^,]* ), ( [^,]* ), ( [^,\ )]*)/ );
        if ( raceColorMatch !== null ) {
            if ( raceColorMatch[ 1 ] == 242 && raceColorMatch[ 2 ] == 242 ) {
                player.race = 'r';
            } else if ( raceColorMatch[ 1 ] == 242 ) {
                player.race = 'z';
            } else if ( raceColorMatch[ 2 ] == 242 ) {
                player.race = 'p';
            } else if ( raceColorMatch[ 3 ] == 242 ) {
                player.race = 't';
            } 
        }
        player.name = $playerCell.find( 'span' ).text().trim();
        return player;
    }

    function cleanTitle( str ) {
        return str[ 0 ].toUpperCase() + str.substr( 1 ).replace( /_/g, ' ' );
    }

    function parseDate( $dateCell ) {
        var dateMatch;
        dateMatch = $dateCell.text().replace( /\[[^\]]+\]/g, '' ).match( /.*(?:19|20)[0-9]{2}/ );
        if ( dateMatch !== null ) {
            return ( new Date( dateMatch ) ).toISODateOnly();
        }
        return '';
    }

    function preg_quote( str, delimiter ) {
        //  discuss at: http://locutus.io/php/preg_quote/
        // original by: booeyOH
        // improved by: Ates Goral (http://magnetiq.com)
        // improved by: Kevin van Zonneveld (http://kvz.io)
        // improved by: Brett Zamir (http://brett-zamir.me)
        // bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
        //   example 1: preg_quote("$40")
        //   returns 1: '\\$40'
        //   example 2: preg_quote("*RRRING* Hello?")
        //   returns 2: '\\*RRRING\\* Hello\\?'
        //   example 3: preg_quote("\\.+*?[^]$(){}=!<>|:")
        //   returns 3: '\\\\\\.\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:'

        return ( str + '' )
            .replace( new RegExp( '[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + ( delimiter || '' ) + '-]', 'g' ), '\\$&' );
    }

    var endDate,
        date,
        i = 0,
        j = 0,
        players = [],
        groupPlayers = [],
        matches = [];

    $( '.infobox-cell-2.infobox-description' ).each( function() {
        if ( $( this ).text() == 'Date:' || $( this ).text() == 'End Date:' ) {
            var timeOfDay,
                localTimezoneOffset = new Date().getTimezoneOffset();
            if ( localTimezoneOffset > 0 ) {
                timeOfDay = '23:59';
            } else {
                timeOfDay = '00:00';
            }
            endDate = new Date( $( this ).parent().find( '.infobox-cell-2:not(.infobox-description)' ).text( ) + ' ' + timeOfDay + ' UTC' );
            return;
        }
    } );
    if ( endDate ) {
        console.log( 'endDate ISO:', endDate.toISODateOnly() );
    }

    $( '.prizepooltable tr' ).each( function() {
        if ( !$( this ).find( 'td[style="height:26px;"]' ).length )
            return;
        players.push( parsePlayerInPrizePoolTable( $( this ).find( 'td[style="height:26px;"]' ) ) );
    } );
    var noPlayersFromPrizePoolTable = ( players.length === 0 );

    $( '.grouptable, .matchlist, .bracket' ).each( function() {
        if ( $( this ).is( '.grouptable' ) ) {
            //console.log( 'grouptable' );
            groupPlayers = [];
            date = '';
            $( this ).find( 'tr' ).each( function() {
                if ( $( this ).find( '.datetime' ).length ) {
                    date = parseDate( $( this ).find( '.datetime' ).first() );
                    return;
                } else if ( $( this ).find( '[data-tz]' ).length ) {
                    date = parseDate( $( this ).find( '[data-tz]' ).parent() );
                    return;
                }
                if ( !$( this ).find( '.grouptableslot' ).length)
                    return;
                var player = parsePlayer( $( this ).find( '.grouptableslot' ) );
                var wdl = $( this ).find( 'b' ).text().trim();
                player.wdl = wdl;
                if ( noPlayersFromPrizePoolTable ) {
                    players.push( player );
                    player.index = players.length - 1;
                } else {
                    for ( j = 0; j < players.length; ++j ) {
                        if ( player.name == players[ j ].name ) {
                            player.index = j;
                        }
                    }
                }
                groupPlayers.push( player );
            } );
        }

        if ( $( this ).is( '.matchlist' ) ) {
            //console.log( 'matchlist' );
            $( this ).find( 'tr:not(.maprow)' ).each( function() {
                if ( $( this ).find( '[colspan="4"]' ).length ) {
                    var newDate = parseDate( $( this ).find( '[colspan="4"]' ).first() );
                    date = newDate ? newDate : date;
                }
                if ( $( this ).find( '.matchlistslot' ).length !== 2 )
                    return;
                var $player1Div, player1Name, player1Win, player1Score, player1Index = -1,
                    $player2Div, player2Name, player2Win, player2Score, player2Index = -1,
                    lastMatch;
                $player1Div = $( this ).children( '.matchlistslot' ).eq( 0 );
                $player2Div = $( this ).children( '.matchlistslot' ).eq( 1 );
                player1Name = $player1Div.text().trim();
                player2Name = $player2Div.text().trim();
                player1Win = $player1Div.css( 'fontWeight' ) == 'bold';
                if ( player1Win && $player2Div.css( 'fontWeight' ) == 'bold' ) {
                    console.log( ( ++i ), 'Error:', $player1Div.text().trim(), 'vs', $player2Div.text().trim() );
                    return;
                } else {
                    player2Win = !player1Win;
                }
                player1Score = $( this ).children( ':not(.matchlistslot)' ).eq( 0 ).text().trim();
                player2Score = $( this ).children( ':not(.matchlistslot)' ).eq( 1 ).text().trim();
                //console.log( ( ++i ), player1Name + ( player1Win ? '[W]' : '' ), player1Score, '-', player2Score, player2Name + ( player2Win ? '[W]' : '' ) );
                if ( groupPlayers.length ) {
                    for ( j = 0; j < groupPlayers.length; ++j ) {
                        if ( player1Index < 0 && player1Name == groupPlayers[ j ].name ) {
                            player1Index = groupPlayers[ j ].index;
                            if ( player1Index )
                                players[ player1Index ].wdl = groupPlayers[ j ].wdl;
                            continue;
                        }
                        if ( player2Index < 0 && player2Name == groupPlayers[ j ].name ) {
                            player2Index = groupPlayers[ j ].index;
                            if ( player2Index )
                                players[ player2Index ].wdl = groupPlayers[ j ].wdl;
                        }
                    }
                } else {
                    for ( j = 0; j < players.length; ++j ) {
                        if ( player1Index < 0 && player1Name == players[ j ].name ) {
                            player1Index = j;
                        } else if ( player2Index < 0 && player2Name == players[ j ].name ) {
                            player2Index = j;
                        }
                    }
                }
                matches.push( [
                    player1Name, player1Index, player1Win, player1Score,
                    player2Name, player2Index, player2Win, player2Score,
                    date
                ] );
                var lastMatch = {};
                if ( player1Index >= 0 ) {
                    lastMatch = {
                        index : matches.length - 1,
                        vsName: player2Name,
                        score: player1Score,
                        vsScore: player2Score,
                        date: date,
                        inGroupStage: true
                    };
                    if ( player2Index >= 0 ) {
                        lastMatch.vsIndex = player2Index;
                    }
                    players[ player1Index ].lastMatch = lastMatch;
                }
                if ( player2Index >= 0 ) {
                    lastMatch = {
                        index : matches.length - 1,
                        vsName: player1Name,
                        score: player2Score,
                        vsScore: player1Score,
                        date: date,
                        inGroupStage: true
                    };
                    if ( player1Index >= 0 ) {
                        lastMatch.vsIndex = player1Index;
                    }
                    players[ player2Index ].lastMatch = lastMatch;
                }
            } );
        }

        if ( $( this ).is( '.bracket' ) ) {
            //console.log( 'bracket' );
            date = '';
            $( this ).find( '.bracket-game' ).each( function() {
                var $player1Div, player1, player1Win, player1Score, player1Index = -1,
                    $player2Div, player2, player2Win, player2Score, player2Index = -1,
                    lastMatch;
                if ( $( this ).find( '.bracket-popup-body-time' ).length ) {
                    date = parseDate( $( this ).find( '.bracket-popup-body-time' ).last() );
                }
                $player1Div = $( this ).find( '.bracket-player-top' );
                $player2Div = $( this ).find( '.bracket-player-bottom' );
                player1 = parsePlayerInBracket( $player1Div );
                player2 = parsePlayerInBracket( $player2Div );
                player1Win = $player1Div.css( 'fontWeight' ) == 'bold';
                if ( player1Win && $player2Div.css( 'fontWeight' ) == 'bold' ) {
                    console.log( ( ++i ), 'Error:', player1.name, 'vs', player2.name );
                    return;
                } else {
                    player2Win = !player1Win;
                }
                player1Score = $player1Div.children( '.bracket-score' ).text().trim();
                player2Score = $player2Div.children( '.bracket-score' ).text().trim();
                //console.log( ( ++i ), player1Name + ( player1Win ? '[W]' : '' ), player1Score, '-', player2Score, player2Name + ( player2Win ? '[W]' : '' ) );
                for ( j = 0; j < players.length; ++j ) {
                    if ( player1Index < 0 && player1.name == players[ j ].name ) {
                        player1Index = j;
                    } else if ( player2Index < 0 && player2.name == players[ j ].name ) {
                        player2Index = j;
                    }
                }
                matches.push( [
                    player1.name, player1Index, player1Win, player1Score,
                    player2.name, player2Index, player2Win, player2Score,
                    date
                ] );
                var lastMatch = {};
                if ( player1Index >= 0 ) {
                    lastMatch = {
                        index : matches.length - 1,
                        vsName: player2.name,
                        vsRace: player2.race,
                        score: player1Score,
                        vsScore: player2Score,
                        date: date,
                        inGroupStage: false
                    };
                    if ( player2Index >= 0 ) {
                        lastMatch.vsIndex = player2Index;
                    }
                    players[ player1Index ].lastMatch = lastMatch;
                }
                if ( player2Index >= 0 ) {
                    lastMatch = {
                        index : matches.length - 1,
                        vsName: player1.name,
                        vsRace: player1.race,
                        score: player2Score,
                        vsScore: player1Score,
                        date: date,
                        inGroupStage: false
                    };
                    if ( player1Index >= 0 ) {
                        lastMatch.vsIndex = player1Index;
                    }
                    players[ player2Index ].lastMatch = lastMatch;
                }
            } );
        }
    } );

    var entries = [];
    var hasAnEntryWithNonEmptyDate = false;
    for ( j = 0; j < players.length; ++j ) {
        entries.push( {} );
        entries[ j ].player = {
            'name': players[ j ].name,
            'page': ( players[ j ].page !== undefined ? players[ j ].page : '' ),
            'flag': players[ j ].flag,
            'race': players[ j ].race
        };
        entries[ j ].hasLastMatchData = ( players[ j ].lastMatch !== undefined );
        if ( entries[ j ].hasLastMatchData ) {
            entries[ j ].hasLastMatchInGroupStage = players[ j ].lastMatch.inGroupStage;
            if ( entries[ j ].hasLastMatchInGroupStage ) {
                entries[ j ].wdl = players[ j ].wdl;
            } else {
                var vsPage = '', vsName = '', vsRace = '';
                if ( players[ j ].lastMatch.vsIndex >= 0 ) {
                    vsPage = ( players[ players[ j ].lastMatch.vsIndex ].page !== undefined ? players[ players[ j ].lastMatch.vsIndex ].page : '' );
                    vsName = players[ players[ j ].lastMatch.vsIndex ].name;
                    vsRace = players[ players[ j ].lastMatch.vsIndex ].race;
                } else {
                    vsName = players[ j ].lastMatch.vsName;
                    vsRace = players[ j ].lastMatch.vsRace;
                }
                entries[ j ].legacy = { 'vsPage' : vsPage, 'vsName': vsName, 'vsRace': vsRace};
                entries[ j ].lastvs = ( vsPage ? vsPage + '{{!}}' : '' ) + vsName;
                entries[ j ].lastvsrace = vsRace;
                if ( players[ j ].lastMatch.score == 'W' ) {
                    entries[ j ].wofrom = true;
                } else if ( players[ j ].lastMatch.vsScore == 'W' ) {
                    entries[ j ].woto = true;
                } else {
                    entries[ j ].lastscore = players[ j ].lastMatch.score;
                    entries[ j ].lastvsscore = players[ j ].lastMatch.vsScore;
                }
            }
            entries[ j ].date = ( forceDateToEndDate ? endDate.toISODateOnly( ) : players[ j ].lastMatch.date );
            hasAnEntryWithNonEmptyDate |= ( entries[ j ].date !== '' );
        }
    }

    if ( action == 'outputtext' ) {
        var text = mw.config.get( 'wgPageName' ) + '\t\t' + summary;
        for ( j = 0; j < entries.length; ++j ) {
            text += '\nppt';
            text += '\t' + entries[ j ].player.name;
            text += '\t' + entries[ j ].player.page;
            text += '\t' + entries[ j ].player.flag;
            text += '\t' + entries[ j ].player.race;
            if ( !entries[ j ].hasLastMatchData ) {
                text += '\t\t\t\t\t\t';
            } else {
                if ( entries[ j ].hasLastMatchInGroupStage ) {
                    text += '\t\t\t';
                    text += '\twdl';
                    text += '\t' + entries[ j ].wdl;
                } else {
                    text += '\t' + entries[ j ].legacy.vsName;
                    text += '\t' + entries[ j ].legacy.vsPage;
                    text += '\t' + entries[ j ].legacy.vsRace;
                    if ( entries[ j ].wofrom )
                        text += '\twofrom\t';
                    else if ( entries[ j ].woto )
                        text += '\twoto\t';
                    else
                        text += '\t' + entries[ j ].lastscore;
                        text += '\t' + entries[ j ].lastvsscore;
                }
                text +='\t' + entries[ j ].date;
            }
        }

        if ( typeof output === 'object' ) {
            output.text( text );
        } else if ( output == 'console' ) {
            console.log( '\n' + text );
        }
    } else if ( action == 'outputcode' || action == 'editpage' ) {
        var pageTitle = mw.config.get( 'wgPageName' );
        var api = new mw.Api( {
            ajax: {
                headers: { 'Api-User-Agent': 'Mozilla/5.0 ( compatible; lastMatchData.js/1.0; chapatiyaq@gmail.com )' }
            }
        } );
        api.get( {
            action: 'query',
            prop: 'info|revisions',
            titles: pageTitle,
            indexpageids: true,
            rvprop: 'content'
        } ).done( function( data ) {
            var originalText = data.query.pages[ data.query.pageids[ 0 ] ].revisions[ 0 ][ '*' ];
            if ( action == 'outputcode' && codeForTableOnly ) {
                var tableMatch = originalText.match( /\{\{ *( Template *: )? *[Pp]rize[ _]pool[ _]start *[\|\}][.\s\S]+?\{\{ *( Template *: )? *[Pp]rize[ _]pool[ _]end *\}\}/ );
                if ( tableMatch !== null )
                    originalText = tableMatch[ 0 ];
            }
            var modifiedText = originalText;

            for ( j = 0; j < entries.length; ++j ) {
                var regExPattern = '(\\| *';
                if ( entries[ j ].player.page !== '' )
                {
                    var rePage = preg_quote( entries[ j ].player.page ),
                        pageChar1 = rePage.substr( 0, 1 ).toUpperCase();
                    rePage = '[' + pageChar1 + pageChar1.toLowerCase() + ']' + rePage.substr( 1 );
                    rePage = rePage.replace( /[ _]/g, '[ _]' );
                    regExPattern += rePage + ' *\\{\\{!\\}\\} *';
                }
                regExPattern += entries[ j ].player.name;
                regExPattern += '[^\\}\\n]+([0-9]+)=[^\\}\\n]+?) *(?=[\\}\\n])';
                var re = new RegExp( regExPattern );
                var matches = modifiedText.match( re );
                if ( matches !== null ) {
                    var i = matches[ 2 ];
                    var append = [];
                    if ( entries[ j ].hasLastMatchInGroupStage ) {
                        append.push( '|wdl' + i + '=' + entries[ j ].wdl );
                    } else {
                        append.push( '|lastvs' + i + '=' + entries[ j ].lastvs );
                        append.push( '|lastvsrace' + i + '=' + entries[ j ].lastvsrace );
                        if ( entries[ j ].wofrom ) {
                            append.push( '|wofrom' + i + '=true' );
                        } else if ( entries[ j ].woto ) {
                            append.push( '|woto' + i + '=true' );
                        } else {
                            append.push( '|lastscore' + i + '=' + entries[ j ].lastscore );
                            append.push( '|lastvsscore' + i + '=' + entries[ j ].lastvsscore );
                        }
                    }
                    if ( hasAnEntryWithNonEmptyDate ) {
                        append.push( '|date' + i + '=' + entries[ j ].date );
                    }
                    var separator = ( matches[ 1 ].match( / +\|/ ) !== null ) ? ' ' : '';
                    var appendText = separator + append.join( separator );
                    modifiedText = modifiedText.replace( re, matches[ 1 ] + appendText );
                }
            }

            if ( typeof output === 'object' ) {
                output.text( modifiedText );
            } else if ( output == 'console' ) {
                console.log( '\n' + modifiedText );
            }

            if ( action == 'editpage' ) {
                mw.user.getGroups().done( function( groups ) {
                    if ( !~groups.indexOf( 'bot' ) ) {
                        console.warn( 'Please use a bot account to edit the page.' );
                    }
                    if ( !window.confirm( 'Do you really want to edit the page?' ) )
                        return;
                    console.log( 'Editing page...' );
                    api.post( {
                        action: 'edit',
                        bot: 'true',
                        title: pageTitle,
                        summary: summary,
                        text: modifiedText,
                        token: mw.user.tokens.get( 'editToken' )
                    } ).done( function( data ) {
                        if ( data && data.edit && data.edit.result == 'Success' ) {
                            // Reload page if edit was successful
                            window.location.reload();
                        } else if ( data && data.error ) {
                            console.log( 'Error: API returned error code "' + data.error.code + '": ' + data.error.info );
                        } else {
                            console.log( 'Error: Unknown result from API.' );
                        }
                    } ).fail( function() {
                        console.log( 'Error while making request to the MW API' );
                    } );
                } ).fail( function() {
                    console.log( 'Error while making request to the MW API' );
                } );
            }
        } ).fail( function() {
            console.log( 'Error while making request to the MW API' );
        } );
    }
};

} );