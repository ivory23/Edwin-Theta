class EdwinLogger {
    constructor() {
        // Check if we're in Node.js environment
        this.isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

        // Set verbose based on environment
        this.verbose = this.isNode ? true : false;

        console.log(`[EdwinLogger initialized ${this.verbose ? 'with' : 'without'} verbose mode]`);
    }

    private isNode: boolean;
    verbose = false;
    closeByNewLine = true;
    useIcons = true;
    logsTitle = 'LOGS';
    warningsTitle = 'WARNINGS';
    errorsTitle = 'ERRORS';
    informationsTitle = 'INFOR LOGS';
    successesTitle = 'SUCCESS';
    debugsTitle = 'DEBUG LOGS';
    assertsTitle = 'ASSERT';

    #getColor(foregroundColor = '', backgroundColor = '') {
        if (!this.isNode) {
            // Browser console styling
            const colors: { [key: string]: string } = {
                black: '#000000',
                red: '#ff0000',
                green: '#00ff00',
                yellow: '#ffff00',
                blue: '#0000ff',
                magenta: '#ff00ff',
                cyan: '#00ffff',
                white: '#ffffff',
            };

            const fg = colors[foregroundColor.toLowerCase()] || colors.white;
            const bg = colors[backgroundColor.toLowerCase()] || 'transparent';
            return `color: ${fg}; background: ${bg};`;
        }

        // Node.js console colors
        let fgc = '\x1b[37m';
        switch (foregroundColor.trim().toLowerCase()) {
            case 'black':
                fgc = '\x1b[30m';
                break;
            case 'red':
                fgc = '\x1b[31m';
                break;
            case 'green':
                fgc = '\x1b[32m';
                break;
            case 'yellow':
                fgc = '\x1b[33m';
                break;
            case 'blue':
                fgc = '\x1b[34m';
                break;
            case 'magenta':
                fgc = '\x1b[35m';
                break;
            case 'cyan':
                fgc = '\x1b[36m';
                break;
            case 'white':
                fgc = '\x1b[37m';
                break;
        }

        let bgc = '';
        switch (backgroundColor.trim().toLowerCase()) {
            case 'black':
                bgc = '\x1b[40m';
                break;
            case 'red':
                bgc = '\x1b[44m';
                break;
            case 'green':
                bgc = '\x1b[44m';
                break;
            case 'yellow':
                bgc = '\x1b[43m';
                break;
            case 'blue':
                bgc = '\x1b[44m';
                break;
            case 'magenta':
                bgc = '\x1b[45m';
                break;
            case 'cyan':
                bgc = '\x1b[46m';
                break;
            case 'white':
                bgc = '\x1b[47m';
                break;
        }

        return `${fgc}${bgc}`;
    }

    #getColorReset() {
        return this.isNode ? '\x1b[0m' : '';
    }

    print(foregroundColor = 'white', backgroundColor = 'black', ...strings: any[]) {
        // Convert objects to strings
        const processedStrings = strings.map(item => {
            if (typeof item === 'object') {
                return JSON.stringify(item, (key, value) => (typeof value === 'bigint' ? value.toString() : value));
            }
            return item;
        });

        if (this.isNode) {
            const c = this.#getColor(foregroundColor, backgroundColor);
            console.log(c, processedStrings.join(''), this.#getColorReset());
        } else {
            const style = this.#getColor(foregroundColor, backgroundColor);
            console.log(`%c${processedStrings.join('')}`, style);
        }

        if (this.closeByNewLine) console.log('');
    }

    #logWithStyle(
        strings: any[],
        options: {
            fg: string;
            bg: string;
            icon: string;
            groupTitle: string;
        }
    ) {
        const { fg, bg, icon, groupTitle } = options;

        const currentTimestamp = new Date().toUTCString();

        if (strings.length > 1) {
            if (this.isNode) {
                const c = this.#getColor(fg, bg);
                console.group(c, (this.useIcons ? icon : '') + `[${groupTitle} | ${currentTimestamp}]:`);
            } else {
                const style = this.#getColor(fg, bg);
                console.group(`%c${this.useIcons ? icon : ''}${groupTitle}`, style);
            }

            const nl = this.closeByNewLine;
            this.closeByNewLine = false;
            strings.forEach(item => {
                this.print(fg, bg, item);
            });
            this.closeByNewLine = nl;
            console.groupEnd();
            if (nl) console.log();
        } else {
            this.print(
                fg,
                bg,
                strings
                    .map(item => {
                        return `[${this.useIcons ? `${icon}` : ''}${groupTitle} | ${currentTimestamp}]: ${item}`;
                    })
                    .join('\n')
            );
        }
    }

    log(...strings: any[]) {
        this.#logWithStyle(strings, {
            fg: 'white',
            bg: '',
            icon: '',
            groupTitle: ` ${this.logsTitle}`,
        });
    }

    warn(...strings: any[]) {
        this.#logWithStyle(strings, {
            fg: 'yellow',
            bg: '',
            icon: '\u26a0',
            groupTitle: ` ${this.warningsTitle}`,
        });
    }

    error(...strings: any[]) {
        this.#logWithStyle(strings, {
            fg: 'red',
            bg: '',
            icon: '\u26D4',
            groupTitle: ` ${this.errorsTitle}`,
        });
    }

    info(...strings: any[]) {
        this.#logWithStyle(strings, {
            fg: 'blue',
            bg: '',
            icon: '\u2757',
            groupTitle: ` ${this.informationsTitle}`,
        });
    }

    debug(...strings: any[]) {
        // Only log debug messages if verbose mode is enabled
        if (!this.verbose) {
            return;
        }
        this.#logWithStyle(strings, {
            fg: 'magenta',
            bg: '',
            icon: '',
            groupTitle: ` ${this.debugsTitle}`,
        });
    }

    success(...strings: any[]) {
        this.#logWithStyle(strings, {
            fg: 'green',
            bg: '',
            icon: '\u2705',
            groupTitle: ` ${this.successesTitle}`,
        });
    }

    assert(...strings: any[]) {
        this.#logWithStyle(strings, {
            fg: 'cyan',
            bg: '',
            icon: '\u2757',
            groupTitle: ` ${this.assertsTitle}`,
        });
    }
}

export const edwinLogger = new EdwinLogger();
edwinLogger.closeByNewLine = true;
edwinLogger.useIcons = true;

export default edwinLogger;
