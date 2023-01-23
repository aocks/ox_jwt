
;; For javascript-mode set the eslint executables to use node_modules
;; so that flycheck works correctly when using emacs.

(
 (js-mode
  . (
     (eval .
	   (set
	    (make-local-variable
	     'flycheck-javascript-eslint-executable)
	    (format
	     "%s/node_modules/eslint/bin/eslint.js"
	     (file-name-directory buffer-file-name)
	     ))))))
