

    module.exports = {
          domains: ['127.0.0.1.xip.io', '*.127.0.0.1.xip.io']
        , wwwFiles: true
        , nunjucks: {
            tags: {
                  variableStart : '{{'
                , variableEnd   : '}}'
            }
            , watch :true
        }
    };