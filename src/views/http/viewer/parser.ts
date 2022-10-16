
/**
 * Create a log parser.
 *
 * @param {String} format
 */

const nginxTimeString2Date = (timeStr: string): Date => {
    const res = timeStr.split(":")
    if (res.length < 4) {
        return new Date()
    }

    // const [date, hours, minutes, seconds_timelag]: [string, string, string, string] = res
    // return new Date(`${date} ${hours}:${minutes}:${seconds_timelag}`)

    return new Date(`${res[0]} ${res[1]}:${res[2]}:${res[3]}`)

}


export const Parser =  function (format) {
    this.directives = {};

    var prefix = format.match(/^[^\$]*/);
    if (prefix) {
        format = this.escape(prefix[0]) + format.slice(prefix[0].length);
    }

    this.parser = format;

    var directive = /\$([a-z_]+)(.)?([^\$]+)?/g
        , match, regex, boundary, i = 1;

    while ((match = directive.exec(format))) {
        this.directives[match[1]] = i++;
        if (match[2]) {
            boundary = this.escape(match[2]);
            regex = '([^' + boundary + ']*?)' + boundary;
            if (match[3]) {
                regex += this.escape(match[3]);
            }
        } else {
            regex = '(.+)$';
        }
        this.parser = this.parser.replace(match[0], regex);
    }

    this.parser = new RegExp(this.parser);
};



/**
 * Parse a log line.
 *
 * @param {Buffer|String} line
 * @param {Function} iterator
 */

Parser.prototype.parseLine = function (line, iterator) {
    var match = line.toString().match(this.parser);
    if (!match) {
        return;
    }

    var row = {
        msec: null
        , time_iso8601: null
        , remote_addr: null
        , query_string: null
        , http_x_forwarded_for: null
        , http_user_agent: null
        , http_referer: null
        , time_local: null
        , request: null
        , status: null
        , request_time: null
        , request_length: null
        , pipe: null
        , connection: null
        , bytes_sent: null
        , body_bytes_sent: null

        , date: null
        , timestamp: null
        , ip: null
        , ip_str: null
    };

    row.raw = line

    for (var key in this.directives) {
        row[key] = match[this.directives[key]];
        if (row[key] === '-') {
            row[key] = null;
        }
    }

    //Parse the timestamp
    if (row.time_iso8601) {
        row.date = new Date(row.time_iso8601);
    } else if (row.msec) {
        row.date = new Date(Number(row.msec.replace('.', '')));
    }
    if (row.date) {
        row.timestamp = row.date.getTime();
    }

    if (row.request) {
        let arr = row.request.split(/\s+/)
        // console.log('arr', arr)
        row.method = arr[0]
        row.url = arr[1]
        // row._request = {
        //     method: arr[0],
        //     url: arr[1],
        // }
    }

    if (row.time_local) {
        row.time_local_date = nginxTimeString2Date(row.time_local)
    }

    

    //Parse the user's IP
    if (row.http_x_forwarded_for) {
        row.ip_str = row.http_x_forwarded_for;
    } else if (row.remote_addr) {
        row.ip_str = row.remote_addr;
    }
    if (row.ip_str) {
        var ip = row.ip_str.split('.', 4);
        row.ip = Number(ip[0]) * (2 << 23) +
            Number(ip[1]) * (2 << 15) +
            Number(ip[2]) * (2 << 7) +
            Number(ip[3]);
    }

    return row
};

/**
 * Escape regular expression tokens.
 *
 * @param {String} str
 * @return {String}
 */

Parser.prototype.escape = function (str) {
    return str.replace(new RegExp('[.*+?|()\\[\\]{}]', 'g'), '\\$&');
};
