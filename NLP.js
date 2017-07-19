var request = require('request-promise');
module.exports = class NLP {
    static getTagsFromText(text) {
        var postData = JSON.stringify({
            "document": {
                "content": text,
                "type": "PLAIN_TEXT"
            }
        });

        return request.post({
            url:     'https://language.googleapis.com/v1/documents:analyzeEntities?key=AIzaSyCUzLjMTEzvYP1AwJL4xOmXu8Zsha4qD9o',
            body:    postData
        }).then(function(body){
            return JSON.parse(body)["entities"].map(function(value){
                return {
                    "name":value.name,
                    "salience":value.salience
                };
            });
        });
    };

    static cleanWord(word){
        // Remove punctuation
        word = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

        // Remove extra spaces
        word = word.replace(/\s{2,}/g," ");;

        return word;

    };

    static getTagsFromTextIncludingTime(text){
        var words = text.split(" ").map(this.cleanWord);
        return this.getTagsFromText(text)
            .then(function(entities){
                for (var i = 0, len = entities.length; i < len; i++) {
                    var wordIndex = words.indexOf(entities[i].name);
                    if (words[wordIndex - 1].toLowerCase() ==="week" || words[wordIndex - 1].toLowerCase() ==="month" || words[wordIndex - 1].toLowerCase() ==="year" || words[wordIndex - 1].toLowerCase() ==="quarter"){
                        entities[i]["time"] = words[wordIndex - 2] + " " + words[wordIndex - 1];
                    }
                }

                return entities;
            });
    };
};




