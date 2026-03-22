export namespace collection {
	
	export class CollectionResponse {
	    id: number[];
	    name: string;
	    slug: string;
	    is_favorite: boolean;
	    isOpen: boolean;
	    items: any;
	
	    static createFrom(source: any = {}) {
	        return new CollectionResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	        this.is_favorite = source["is_favorite"];
	        this.isOpen = source["isOpen"];
	        this.items = source["items"];
	    }
	}
	export class CreateCollectionRequest {
	    workspace_id: number[];
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateCollectionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.workspace_id = source["workspace_id"];
	        this.name = source["name"];
	    }
	}
	export class CreateFolderRequest {
	    collection_id: number[];
	    parent_id?: number[];
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateFolderRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.collection_id = source["collection_id"];
	        this.parent_id = source["parent_id"];
	        this.name = source["name"];
	    }
	}
	export class FolderResponse {
	    id: number[];
	    collection_id: number[];
	    parent_id?: number[];
	    name: string;
	    slug: string;
	    idx: number;
	
	    static createFrom(source: any = {}) {
	        return new FolderResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.collection_id = source["collection_id"];
	        this.parent_id = source["parent_id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	        this.idx = source["idx"];
	    }
	}
	export class MoveCollectionRequest {
	    target_workspace_id: number[];
	
	    static createFrom(source: any = {}) {
	        return new MoveCollectionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target_workspace_id = source["target_workspace_id"];
	    }
	}
	export class RenameFolderRequest {
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new RenameFolderRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	    }
	}

}

export namespace environment {
	
	export class EnvironmentVariable {
	    id: string;
	    key: string;
	    value: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new EnvironmentVariable(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.key = source["key"];
	        this.value = source["value"];
	        this.enabled = source["enabled"];
	    }
	}
	export class CreateEnvironmentRequest {
	    workspace_id: number[];
	    name: string;
	    variables: EnvironmentVariable[];
	
	    static createFrom(source: any = {}) {
	        return new CreateEnvironmentRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.workspace_id = source["workspace_id"];
	        this.name = source["name"];
	        this.variables = this.convertValues(source["variables"], EnvironmentVariable);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EnvironmentResponse {
	    id: number[];
	    workspace_id: number[];
	    name: string;
	    slug: string;
	    variables: EnvironmentVariable[];
	
	    static createFrom(source: any = {}) {
	        return new EnvironmentResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.workspace_id = source["workspace_id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	        this.variables = this.convertValues(source["variables"], EnvironmentVariable);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class UpdateEnvironmentRequest {
	    name: string;
	    variables: EnvironmentVariable[];
	
	    static createFrom(source: any = {}) {
	        return new UpdateEnvironmentRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.variables = this.convertValues(source["variables"], EnvironmentVariable);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace workspace {
	
	export class CreateWorkspaceRequest {
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateWorkspaceRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	    }
	}
	export class WorkspaceResponse {
	    id: number[];
	    name: string;
	    slug: string;
	
	    static createFrom(source: any = {}) {
	        return new WorkspaceResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	    }
	}

}

