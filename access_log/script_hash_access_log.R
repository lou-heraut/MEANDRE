# Copyright 2024
# Louis Héraut (louis.heraut@inrae.fr)*1

# *1   INRAE, France

# This file is part of MEANDRE.

# MEANDRE is free software: you can redistribute it and/or
# modify it under the terms of the GNU General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.

# MEANDRE is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with MEANDRE.
# If not, see <https://www.gnu.org/licenses/>.


## LIBRARY AND TOOLS _________________________________________________
library(dotenv)
library(digest)
library(dplyr)

get_salt = function () {
    salt <- paste0(sample(c(letters, LETTERS, 0:9,
                            "!", "@", "#", "$",
                            "%", "^", "&", "*"), 32,
                          replace=TRUE), collapse = "")
    return (salt)
}

apply_hash = function (x) {
    digest(paste0(HASH_SALT, x), algo="sha256")
}


## CONFIG ____________________________________________________________
load_dot_env("../.env")
APP_NAME = Sys.getenv("APP_NAME")
SERVER_NAME = Sys.getenv("SERVER_NAME")
HASH_SALT = Sys.getenv("HASH_SALT")
today = Sys.Date()

Paths_log = list.files("/var/log/apache2/", pattern=paste0(APP_NAME, "_access"), full.names=TRUE)
# Paths_log = list.files("log", pattern=paste0(APP_NAME, "_access"), full.names=TRUE)

outdir = "hash_access_log"
if (!dir.exists(outdir)) {
    dir.create(outdir)
}


## DATA RETENTION ____________________________________________________
Paths_hash = list.files(outdir, full.names=TRUE)
Date = as.Date(gsub("(.*[_])|([.].*)", "",
                    basename(Paths_hash)))

retention_date = today - lubridate::years(1)
Paths_hash_to_delete = Paths_hash[Date < retention_date]
unlink(Paths_hash_to_delete)


## HASHING ___________________________________________________________
Id = stringr::str_extract(basename(Paths_log), "[[:digit:]]+")
isNA = is.na(Id)
Paths_log = Paths_log[!isNA]
Id = Id[!isNA]
Id = as.numeric(Id)
Paths_log = Paths_log[order(Id)]
nPaths_log = length(Paths_log)

for (i in 1:nPaths_log) {
    path_log = Paths_log[i]
    date = today - i

    isgz = grepl("[.]gz$", basename(path_log))
    if (isgz) {
        path_log = gzfile(path_log, "r")
    }
    Lines = readLines(path_log)
    if (isgz) {
        close(path_log)
    }
    
    Lines = Lines[grepl(SERVER_NAME, Lines)]
    IP = gsub("[ ].*", "", Lines)
    IP = IP[!duplicated(IP)]
    IPhash = sapply(IP, apply_hash, USE.NAMES=FALSE)

    if (length(IPhash) > 0) {
        filepath = file.path(outdir,
                             paste0(APP_NAME, "_access_log_",
                                    date, ".txt"))
        writeLines(IPhash, filepath)
    }
}

warnings()
